import { TOUR, focusAt, frameAt, tourUrl, type Tier } from '@/content/tour';

/*
  TourEngine — one long frame sequence on one canvas.

  Motion    The scroll sets a target; the camera follows it like a body with mass (an exponential
            ease, frame-rate independent), so it glides, settles, and reverses without a jolt.
  Loading   Coarse to fine. Every 64th frame of the whole tour first, down to every 8th: within a
            second or two any point can be scrubbed. The frames in between load only round the
            camera, further ahead in its direction of travel than behind.
  Decoding  Drawing a compressed picture means decoding it first, and a 1080p decode is longer than
            a screen refresh. So a short run of frames ahead of the camera is decoded in the
            background into bitmaps, and drawing is only ever a blit. When the camera moves faster
            than frames can be decoded, every 2nd, 4th or 8th is prepared instead, so the picture
            keeps up with the hand; when it slows, the exact frame arrives within a few
            milliseconds.
  Memory    The bitmap run is capped (about 200 MB of pixels on a desktop, 90 MB on a phone) and
            bitmaps behind the camera are closed. Compressed frames far from the camera are
            dropped too (the coarse grid stays); files remain in the HTTP cache.
  Sizes     md 1920 for landscape, sm 864x1536 for phones. On large or dense screens, when the
            camera rests, the single frame on screen is replaced by its 2560 version.
  Budget    Data saver, 2g/3g or little memory: every 2nd or 4th frame, fewer parallel requests,
            no 2560 pass.
*/

const COARSE = [64, 32, 16, 8];
const FINE = [4, 2, 1];
const AHEAD = 110;
const BEHIND = 50;
const IDLE_AHEAD = 30; // before the first scroll
const KEEP = 190; // fine frames further than this from the camera are released
const TAU = 0.115; // seconds: how long the camera takes to close ~63% of the gap to the scroll
const REST_MS = 170;
// decoders running at once: leave cores for the page itself
const DECODERS = Math.max(1, Math.min(3, (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4) - 2));

export class TourEngine {
  /** smoothed tour progress, 0 → 1 */
  p = 0;
  frame = 0;
  /** the frame actually on the canvas (it can trail `frame` by a few while decoding catches up) */
  shown = -1;
  private target = 0;
  private ctx: CanvasRenderingContext2D;
  /** compressed frames, as downloaded */
  private imgs = new Map<number, Blob>();
  private asked = new Set<number>();
  private active = 0;
  private tier: Exclude<Tier, 'hd'> = 'md';
  private gen = 0;
  private dir = 1;
  private drawn = '';
  private first = false;
  private dead = false;
  private dirty = true;
  private restTimer = 0;
  private hd: { frame: number; bm: ImageBitmap } | null = null;
  private hdAllowed = false;
  private stride: number;
  private parallel: number;
  private slow: boolean;
  /** the visitor has started to scroll: until then, load little beyond the coarse grid */
  private engaged = false;
  private timings: number[] = [];
  /* decoded frames round the camera */
  private bitmaps = new Map<number, ImageBitmap>();
  private decoding = new Set<number>();
  private decodeMs = 24;
  private speed = 0; // frames per second
  private budget = 16; // bitmaps
  private readonly roomy: boolean;

  constructor(
    private canvas: HTMLCanvasElement,
    private onFirstFrame: () => void,
  ) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const type = nav.connection?.effectiveType ?? '4g';
    const saver = !!nav.connection?.saveData;
    const mem = nav.deviceMemory ?? 8;
    this.slow = saver || type !== '4g' || mem <= 2;
    this.stride = saver || /2g/.test(type) ? 4 : type === '3g' || mem <= 2 ? 2 : 1;
    this.parallel = this.slow ? 3 : 6;
    this.roomy = mem >= 8;
    this.resize();
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.canvas;
    if (!w || !h) return;
    const tier = w / h <= 0.68 ? 'sm' : 'md';
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.hdAllowed = tier === 'md' && !this.slow && w * dpr >= 2100;
    const src = TOUR.tiers[this.hdAllowed ? 'hd' : tier];
    // never more canvas pixels than the picture can fill
    const scale = Math.min(dpr, Math.max(src.w / w, src.h / h, 1));
    const cw = Math.round(w * scale);
    const ch = Math.round(h * scale);
    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
    }
    if (tier !== this.tier) {
      this.tier = tier;
      this.gen++;
      this.imgs.clear();
      this.asked.clear();
      this.dropBitmaps();
    }
    const px = TOUR.tiers[tier].w * TOUR.tiers[tier].h * 4;
    this.budget = Math.min(28, Math.max(8, Math.floor(((tier === 'md' && this.roomy ? 200 : 90) * 1e6) / px)));
    this.drawn = '';
    this.dirty = true;
    this.pump();
  }

  setTarget(p: number) {
    const t = Math.min(1, Math.max(0, p));
    if (t !== this.target && !this.engaged && this.first) {
      this.engaged = true;
      this.pump();
    }
    this.target = t;
  }

  /** jump without the glide (first paint, deep links) */
  snap(p: number) {
    this.setTarget(p);
    this.p = this.target;
    this.dirty = true;
  }

  /** advance the camera by dt seconds and draw if anything changed */
  step(dt: number) {
    if (this.dead) return;
    const gap = this.target - this.p;
    if (gap !== 0) {
      if (Math.abs(gap) < 0.00004) this.p = this.target;
      else {
        this.p += gap * (1 - Math.exp(-dt / TAU));
        this.dir = gap > 0 ? 1 : -1;
      }
      const f = frameAt(this.p);
      if (f !== this.frame) {
        // how fast the camera is going, smoothed: it sets how finely frames are prepared ahead
        this.speed += (Math.abs(f - this.frame) / Math.max(dt, 0.004) - this.speed) * 0.3;
        this.frame = f;
        this.dirty = true;
        this.setHd(null);
        this.pump();
        this.plan();
        if (f % 24 === 0) this.release();
      }
      window.clearTimeout(this.restTimer);
      if (this.hdAllowed) this.restTimer = window.setTimeout(() => this.refine(), REST_MS);
    } else if (this.speed !== 0) {
      this.speed = 0;
      this.plan(); // at rest: make sure the exact frame is the one on screen
      this.dirty = true;
    }
    if (this.dirty) this.draw();
  }

  destroy() {
    this.dead = true;
    window.clearTimeout(this.restTimer);
    this.imgs.clear();
    this.dropBitmaps();
  }

  /* —— loading —— */

  private nearest(level: number, lo: number, hi: number): number | null {
    const c = Math.round(this.frame / level) * level;
    const last = TOUR.count - 1;
    for (let d = 0; d <= TOUR.count; d += level) {
      // look ahead in the direction of travel first
      for (const i of this.dir > 0 ? [c + d, c - d] : [c - d, c + d]) {
        if (i >= Math.max(0, lo) && i <= Math.min(last, hi) && !this.asked.has(i)) return i;
      }
      if (c + d > hi && c - d < lo) break;
    }
    return null;
  }

  private next(): number | null {
    if (!this.asked.has(this.frame)) return this.frame;
    for (const level of COARSE) {
      const i = this.nearest(level, 0, TOUR.count - 1);
      if (i !== null) return i;
    }
    if (!this.asked.has(TOUR.count - 1)) return TOUR.count - 1;
    const ahead = this.engaged ? AHEAD : IDLE_AHEAD;
    const lo = this.frame - (this.dir > 0 ? BEHIND : ahead);
    const hi = this.frame + (this.dir > 0 ? ahead : BEHIND);
    for (const level of FINE) {
      if (level < this.stride) break;
      const i = this.nearest(level, lo, hi);
      if (i !== null) return i;
    }
    return null;
  }

  private pump() {
    while (this.active < this.parallel) {
      const i = this.next();
      if (i === null) return;
      this.load(i);
    }
  }

  private load(i: number) {
    const gen = this.gen;
    this.asked.add(i);
    this.active++;
    const began = performance.now();
    const done = (blob: Blob | null) => {
      this.active--;
      if (this.dead) return;
      if (blob) this.gauge(performance.now() - began);
      if (gen === this.gen) {
        if (blob) {
          this.imgs.set(i, blob);
          this.plan();
        } else this.asked.delete(i);
      }
      this.pump();
    };
    // as bytes, not as an <img>: createImageBitmap(blob) decodes off the main thread
    fetch(tourUrl(this.tier, i))
      .then((r) => (r.ok ? r.blob() : null))
      .then(done, () => done(null));
  }

  /**
   * The browser does not always say the line is slow (and desktop Safari never does). If the first
   * frames take long to arrive, treat it as slow from here on: every 4th frame, fewer requests, no 2560.
   */
  private gauge(ms: number) {
    if (this.slow || this.timings.length >= 6) return;
    this.timings.push(ms);
    if (this.timings.length < 4) return;
    const sorted = [...this.timings].sort((a, b) => a - b);
    if (sorted[sorted.length >> 1] > 900) {
      this.slow = true;
      this.stride = 4;
      this.parallel = 3;
      this.hdAllowed = false;
    }
  }

  private release() {
    for (const i of this.imgs.keys()) {
      if (i % 8 !== 0 && Math.abs(i - this.frame) > KEEP) {
        this.imgs.delete(i);
        this.asked.delete(i);
      }
    }
  }

  /* —— decoding ahead —— */

  /** every how many frames to prepare, given the camera's speed and how fast this device decodes */
  private step_(): number {
    const perSecond = (DECODERS / this.decodeMs) * 1000 * 0.75;
    const need = this.speed / perSecond;
    for (const s of [1, 2, 4, 8, 16]) if (need <= s) return s;
    return 32;
  }

  /** the closest frame to i whose bytes are here (the coarse grid is, soon after load) */
  private loadedNear(i: number): number | null {
    if (this.imgs.has(i)) return i;
    for (const level of [2, 4, 8, 16, 32, 64]) {
      const j = Math.round(i / level) * level;
      if (j < TOUR.count && this.imgs.has(j)) return j;
    }
    return null;
  }

  private plan() {
    if (this.dead) return;
    const s = this.step_();
    const ahead = Math.floor(this.budget * 0.7) * s;
    const behind = Math.floor(this.budget * 0.15) * s;
    const lo = this.frame - (this.dir > 0 ? behind : ahead);
    const hi = this.frame + (this.dir > 0 ? ahead : behind);
    // where the camera is heading: it will come to rest there, so that frame is worth having early
    const goal = frameAt(this.target);
    for (const [i, bm] of this.bitmaps) {
      if ((i < lo - s || i > hi + s) && Math.abs(i - goal) > Math.max(s, 8)) {
        bm.close();
        this.bitmaps.delete(i);
      }
    }
    if (this.decoding.size >= DECODERS) return;
    const want: number[] = [];
    if (s === 1 || this.speed === 0) want.push(this.frame);
    // aim a little ahead of the camera: by the time a frame is decoded, the camera has moved on
    const lead = Math.min((this.speed * this.decodeMs) / 1000, Math.abs(goal - this.frame));
    const base = Math.round((this.frame + this.dir * lead) / s) * s;
    want.push(base);
    if (Math.abs(goal - this.frame) > s) {
      const g = this.loadedNear(goal);
      if (g !== null) want.push(g);
    }
    for (let d = s; d <= ahead; d += s) {
      want.push(base + d * this.dir);
      if (d <= behind) want.push(base - d * this.dir);
    }
    for (const i of want) {
      if (this.decoding.size >= DECODERS) return;
      if (i < 0 || i >= TOUR.count || this.bitmaps.has(i) || this.decoding.has(i)) continue;
      const img = this.imgs.get(i);
      if (img) this.decode(i, img);
    }
  }

  private decode(i: number, img: Blob) {
    const gen = this.gen;
    const began = performance.now();
    this.decoding.add(i);
    createImageBitmap(img).then(
      (bm) => {
        this.decoding.delete(i);
        this.decodeMs += (performance.now() - began - this.decodeMs) * 0.2;
        if (this.dead || gen !== this.gen || this.bitmaps.size > this.budget + 4) return bm.close();
        this.bitmaps.set(i, bm);
        this.dirty = true;
        this.plan();
      },
      () => {
        this.decoding.delete(i);
      },
    );
  }

  private dropBitmaps() {
    for (const bm of this.bitmaps.values()) bm.close();
    this.bitmaps.clear();
    this.decoding.clear();
    this.setHd(null);
  }

  /** the camera has come to rest: fetch this one frame at 2560 and put it on screen */
  private refine() {
    if (this.dead || !this.hdAllowed || this.p !== this.target) return;
    const frame = this.frame;
    fetch(tourUrl('hd', frame))
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((blob) => createImageBitmap(blob))
      .then(
        (bm) => {
          if (this.dead || this.frame !== frame || this.p !== this.target) return bm.close();
          this.setHd({ frame, bm });
          this.dirty = true;
        },
        () => {},
      );
  }

  private setHd(next: { frame: number; bm: ImageBitmap } | null) {
    this.hd?.bm.close();
    this.hd = next;
  }

  /* —— drawing —— */

  private pick(): { img: ImageBitmap; frame: number; key: string } | null {
    const f = this.frame;
    if (this.hd && this.hd.frame === f) return { img: this.hd.bm, frame: f, key: `hd${f}` };
    // this frame if it is decoded, else the closest one that is
    let best = -1;
    for (const i of this.bitmaps.keys()) if (best < 0 || Math.abs(i - f) < Math.abs(best - f)) best = i;
    return best < 0 ? null : { img: this.bitmaps.get(best)!, frame: best, key: `b${best}` };
  }

  private draw() {
    const got = this.pick();
    if (!got) return; // nothing loaded yet: the poster underneath stays
    // keep asking until the exact frame is what is on screen
    this.dirty = got.frame !== this.frame;
    const { canvas, ctx } = this;
    const key = `${this.tier}${got.key}|${canvas.width}x${canvas.height}`;
    if (key === this.drawn) return;
    this.drawn = key;
    this.shown = got.frame;
    const cw = canvas.width;
    const ch = canvas.height;
    const w = got.img.width;
    const h = got.img.height;
    const scale = Math.max(cw / w, ch / h);
    const sw = cw / scale;
    const sh = ch / scale;
    // object-fit: cover, held on the subject; sm frames are already cut round it
    const fx = this.tier === 'sm' ? 0.5 : focusAt(got.frame);
    const sx = Math.min(Math.max(w * fx - sw / 2, 0), w - sw);
    ctx.imageSmoothingQuality = this.speed === 0 ? 'high' : 'medium';
    ctx.drawImage(got.img, sx, (h - sh) / 2, sw, sh, 0, 0, cw, ch);
    if (!this.first) {
      this.first = true;
      this.onFirstFrame();
      if (this.hdAllowed) this.restTimer = window.setTimeout(() => this.refine(), REST_MS * 4);
    }
  }
}

/** The tour needs AVIF and createImageBitmap; without them the page shows stills instead */
export function supportsAvif(): Promise<boolean> {
  if (typeof createImageBitmap !== 'function' || typeof fetch !== 'function') return Promise.resolve(false);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width === 1);
    img.onerror = () => resolve(false);
    img.src =
      'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
}
