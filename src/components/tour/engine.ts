import { TOUR, focusAt, frameAt, tourUrl, type Tier } from '@/content/tour';

/*
  TourEngine — one long frame sequence on one canvas.

  Camera    The scroll sets a target; the camera follows it as a critically damped spring. It
            starts moving in the same frame as the hand, carries its velocity through a change of
            direction, and settles without overshoot. Wheel and trackpad arrive already eased by
            Lenis, so the spring is stiff there; touch arrives raw, so it is softer.
  Loading   Coarse to fine. Every 64th frame of the whole tour first, down to every 8th: within a
            second or two any point can be scrubbed. The frames in between load round the camera,
            further ahead the faster it travels.
  Decoding  Drawing a compressed picture means decoding it first, and a decode is longer than a
            screen refresh. So a run of frames ahead of the camera (and the frame it is heading
            for) is decoded off the main thread into bitmaps, and drawing is only ever a blit.
            When the camera outruns the decoders, every 2nd, 4th … frame is prepared instead.
  Proxies   Every frame also exists at a quarter of the pixels (xs / xp, about 10 KB, decoded in a
            few milliseconds). They are fetched in the background and decoded just ahead of the
            camera. When a full frame is not ready for where the camera is, its proxy is shown
            instead of a sharper frame from further back: in fast travel the picture stays exactly
            under the hand, slightly soft, and sharpens the moment the camera slows.
  Sizes     sm 864x1536 for phones, md 1920 for landscape. Screens that can show more get 2560:
            · strong machines (6+ cores, 8+ GB, a fast line) scrub the whole tour at 2560, and step
              down to 1920 by themselves if decoding cannot keep up;
            · the others scrub at 1920 and, when the camera rests, the 2560 frame fades in over it
              (a fade, not a swap, so sharpness never jumps).
  Memory    The bitmap run is capped by pixels (90–320 MB by device) and closed behind the camera.
            Compressed frames far from the camera are dropped (the coarse grid stays).
  Budget    Data saver, 2g/3g, little memory, or first frames that arrive slowly: every 2nd or 4th
            frame, fewer parallel requests, never 2560.
*/

const COARSE = [64, 32, 16, 8];
const FINE = [4, 2, 1];
const AHEAD = 96;
const BEHIND = 44;
const IDLE_AHEAD = 30; // before the first scroll
const KEEP = 140; // compressed frames further than this from the camera are released
const REST_MS = 140;
const FADE_MS = 260;
// spring stiffness (rad/s): how eagerly the camera closes on the scroll
const OMEGA = { wheel: 30, touch: 17 };
// decoders running at once: leave cores for the page itself
const CORES = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
const DECODERS = Math.max(1, Math.min(4, CORES - 2));

type Scrub = 'md' | 'sm' | 'hd';
// proxies decoded round the camera: about 1.3 MB of pixels each
const PROXY_AHEAD = 30;
const PROXY_BEHIND = 8;

export class TourEngine {
  /** camera position on the tour, 0 → 1 */
  p = 0;
  frame = 0;
  /** the frame actually on the canvas (it can trail `frame` by a few while decoding catches up) */
  shown = -1;
  /** whether that frame is a proxy (for the checks) */
  shownProxy = false;
  /** the size being scrubbed */
  tier: Scrub = 'md';
  private v = 0;
  private target = 0;
  private omega = OMEGA.wheel;
  private ctx: CanvasRenderingContext2D;
  /** compressed frames, as downloaded */
  private imgs = new Map<number, Blob>();
  private asked = new Set<number>();
  private active = 0;
  private gen = 0;
  private dir = 1;
  private drawn = '';
  private first = false;
  private dead = false;
  private dirty = true;
  private restTimer = 0;
  private hd: { frame: number; bm: ImageBitmap; since: number } | null = null;
  private refineAtRest = false;
  private stride: number;
  private parallel: number;
  private slow: boolean;
  private readonly strong: boolean;
  private readonly roomy: boolean;
  private forced: Scrub | null = null;
  /** the visitor has started to scroll: until then, load little beyond the coarse grid */
  private engaged = false;
  private timings: number[] = [];
  private bitmaps = new Map<number, ImageBitmap>();
  /* the same frames at a quarter of the pixels */
  private pBlobs = new Map<number, Blob>();
  private pAsked = new Set<number>();
  private pActive = 0;
  private pBitmaps = new Map<number, ImageBitmap>();
  private pDecoding = new Set<number>();
  private decoding = new Set<number>();
  private decodeMs = 24;
  private decodes = 0;
  private speed = 0; // frames per second
  private budget = 16; // bitmaps
  private frameMs = 16;
  private movingFrames = 0;

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
    this.strong = !this.slow && this.roomy && CORES >= 6;
    // ?tourtier=hd|md forces a size (for testing on machines that would not choose it)
    const q = /[?&]tourtier=(hd|md|sm)/.exec(location.search);
    if (q) this.forced = q[1] as Scrub;
    this.resize();
  }

  /** touch scrolls arrive raw, wheel and trackpad arrive eased */
  setInput(kind: 'wheel' | 'touch') {
    this.omega = OMEGA[kind];
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.canvas;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const portrait = w / h <= 0.68;
    const dense = !portrait && !this.slow && w * dpr >= 2100;
    const tier: Scrub = this.forced ?? (portrait ? 'sm' : dense && this.strong ? 'hd' : 'md');
    this.refineAtRest = tier === 'md' && dense;
    const src = TOUR.tiers[tier === 'md' && dense ? 'hd' : tier];
    // never more canvas pixels than the picture can fill
    const scale = Math.min(dpr, Math.max(src.w / w, src.h / h, 1));
    const cw = Math.round(w * scale);
    const ch = Math.round(h * scale);
    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
    }
    if (tier !== this.tier) this.setTier(tier);
    const px = TOUR.tiers[this.tier].w * TOUR.tiers[this.tier].h * 4;
    const mb = this.tier === 'sm' ? 90 : this.strong ? 320 : this.roomy ? 200 : 110;
    this.budget = Math.min(30, Math.max(8, Math.floor((mb * 1e6) / px)));
    this.drawn = '';
    this.dirty = true;
    this.pump();
  }

  private get proxyTier(): 'xs' | 'xp' {
    return this.tier === 'sm' ? 'xp' : 'xs';
  }

  private setTier(tier: Scrub) {
    const turned = (tier === 'sm') !== (this.tier === 'sm');
    this.tier = tier;
    if (turned) {
      for (const bm of this.pBitmaps.values()) bm.close();
      this.pBitmaps.clear();
      this.pDecoding.clear();
      this.pBlobs.clear();
      this.pAsked.clear();
    }
    this.gen++;
    this.imgs.clear();
    this.asked.clear();
    this.dropBitmaps();
    this.decodes = 0;
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
    this.v = 0;
    this.dirty = true;
  }

  /** advance the camera by dt seconds and draw if anything changed */
  step(dt: number) {
    if (this.dead) return;
    const d = this.p - this.target;
    if (d !== 0 || this.v !== 0) {
      // critically damped spring, integrated exactly: stable at any frame rate
      const w = this.omega;
      const e = Math.exp(-w * dt);
      const c = this.v + w * d;
      this.p = this.target + (d + c * dt) * e;
      this.v = (this.v - w * c * dt) * e;
      if (Math.abs(this.p - this.target) < 0.00003 && Math.abs(this.v) < 0.0005) {
        this.p = this.target;
        this.v = 0;
      }
      if (this.v !== 0) this.dir = this.v > 0 ? 1 : -1;
      // 2560 while moving is only worth it if the screen still refreshes on time: if not, step down
      if (this.tier === 'hd' && !this.forced) {
        this.frameMs += (dt * 1000 - this.frameMs) * 0.05;
        if (++this.movingFrames > 90 && this.frameMs > 21) {
          this.refineAtRest = true;
          this.setTier('md');
          this.pump();
        }
      }
      const f = frameAt(this.p);
      if (f !== this.frame) {
        // how fast the camera is going, smoothed: it sets how far ahead and how finely to prepare
        this.speed += (Math.abs(f - this.frame) / Math.max(dt, 0.004) - this.speed) * 0.3;
        this.frame = f;
        this.dirty = true;
        this.setHd(null);
        this.pump();
        this.plan();
        if (f % 24 === 0) this.release();
      }
      window.clearTimeout(this.restTimer);
      if (this.refineAtRest) this.restTimer = window.setTimeout(() => this.refine(), REST_MS);
    } else if (this.speed !== 0) {
      this.speed = 0;
      this.plan(); // at rest: make sure the exact frame is the one on screen
      this.dirty = true;
    }
    if (this.dirty || this.hd) this.draw();
  }

  destroy() {
    this.dead = true;
    for (const bm of this.pBitmaps.values()) bm.close();
    this.pBitmaps.clear();
    this.pBlobs.clear();
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
    // the faster the camera, the further ahead the bytes should already be
    const ahead = this.engaged ? AHEAD + Math.min(this.speed * 0.5, 120) : IDLE_AHEAD;
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
   * The browser does not always say the line is slow (and Safari never does). If the first frames
   * take long to arrive, treat it as slow from here on.
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
      this.refineAtRest = false;
      if (this.tier === 'hd' && !this.forced) this.setTier('md');
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
  private stepSize(): number {
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

  /** fetch every proxy, nearest to the camera first: they are small enough to hold them all */
  private pumpProxies() {
    if (this.dead || !this.first) return;
    const step = this.stride >= 4 ? 2 : 1;
    while (this.pActive < 5) {
      let pick = -1;
      const c = Math.round(this.frame / step) * step;
      for (let d = 0; d < TOUR.count && pick < 0; d += step) {
        for (const i of this.dir > 0 ? [c + d, c - d] : [c - d, c + d]) {
          if (i >= 0 && i < TOUR.count && !this.pAsked.has(i)) {
            pick = i;
            break;
          }
        }
      }
      if (pick < 0) return;
      const i = pick;
      const gen = this.gen;
      const tier = this.proxyTier;
      this.pAsked.add(i);
      this.pActive++;
      fetch(tourUrl(tier, i))
        .then((r) => (r.ok ? r.blob() : null))
        .then(
          (b) => b,
          () => null,
        )
        .then((blob) => {
          this.pActive--;
          if (this.dead) return;
          if (blob && tier === this.proxyTier) {
            this.pBlobs.set(i, blob);
            if (Math.abs(i - this.frame) <= PROXY_AHEAD) this.planProxies();
          } else if (gen === this.gen) this.pAsked.delete(i);
          this.pumpProxies();
        });
    }
  }

  /** keep a run of proxies decoded just round the camera */
  private planProxies() {
    if (this.dead) return;
    const lo = this.frame - (this.dir > 0 ? PROXY_BEHIND : PROXY_AHEAD);
    const hi = this.frame + (this.dir > 0 ? PROXY_AHEAD : PROXY_BEHIND);
    // where the scroll already is: the camera will pass through there within moments
    const goal = frameAt(this.target);
    for (const [i, bm] of this.pBitmaps) {
      const between = (i - this.frame) * (goal - i) >= 0; // on the way from the camera to the goal
      if ((i < lo - 4 || i > hi + 4) && Math.abs(i - goal) > 6 && !between) {
        bm.close();
        this.pBitmaps.delete(i);
      }
    }
    // nothing to prepare while the camera rests on a full frame
    if (this.speed === 0 && this.bitmaps.has(this.frame)) return;
    // in a long jump, lay proxies along the way at a stride the decoders can keep up with
    const span = Math.abs(goal - this.frame);
    const stride = span > PROXY_AHEAD ? Math.ceil(span / PROXY_AHEAD) : 1;
    const want: number[] = [this.frame, goal];
    for (let d = 1; d <= PROXY_AHEAD; d++) want.push(this.frame + d * stride * this.dir);
    for (let d = 1; d <= PROXY_BEHIND; d++) want.push(this.frame - d * this.dir);
    for (const i of want) {
      {
        if (this.pDecoding.size >= 3) break;
        if (i < 0 || i >= TOUR.count || this.pBitmaps.has(i) || this.pDecoding.has(i)) continue;
        if (stride === 1 && (i < lo || i > hi) && i !== goal) continue;
        const blob = this.pBlobs.get(i);
        if (!blob) continue;
        const tier = this.proxyTier;
        this.pDecoding.add(i);
        createImageBitmap(blob).then(
          (bm) => {
            this.pDecoding.delete(i);
            if (this.dead || tier !== this.proxyTier || this.pBitmaps.size > PROXY_AHEAD + PROXY_BEHIND + 16) return bm.close();
            this.pBitmaps.set(i, bm);
            if (Math.abs(i - this.frame) <= 3) this.dirty = true;
            this.planProxies();
          },
          () => {
            this.pDecoding.delete(i);
          },
        );
      }
    }
  }

  private plan() {
    if (this.dead) return;
    this.planProxies();
    const s = this.stepSize();
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
        if (this.dead || gen !== this.gen) return bm.close();
        this.decodeMs += (performance.now() - began - this.decodeMs) * 0.2;
        // scrubbing at 2560 was a bet on this machine: if its decodes are slow, step down for good
        if (this.tier === 'hd' && !this.forced && ++this.decodes > 16 && this.decodeMs > 30) {
          bm.close();
          this.refineAtRest = true;
          this.setTier('md');
          this.pump();
          return;
        }
        if (this.bitmaps.size > this.budget + 4) return bm.close();
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

  /** the camera has come to rest: fetch this one frame at 2560 and let it fade in */
  private refine() {
    if (this.dead || !this.refineAtRest || this.p !== this.target) return;
    const frame = this.frame;
    fetch(tourUrl('hd', frame))
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((blob) => createImageBitmap(blob))
      .then(
        (bm) => {
          if (this.dead || this.frame !== frame || this.p !== this.target) return bm.close();
          this.setHd({ frame, bm, since: performance.now() });
        },
        () => {},
      );
  }

  private setHd(next: { frame: number; bm: ImageBitmap; since: number } | null) {
    this.hd?.bm.close();
    this.hd = next;
    if (!next) this.drawn = '';
  }

  /* —— drawing —— */

  private pick(): { img: ImageBitmap; frame: number; proxy: boolean } | null {
    const f = this.frame;
    const near = (m: Map<number, ImageBitmap>) => {
      let best = -1;
      for (const i of m.keys()) if (best < 0 || Math.abs(i - f) < Math.abs(best - f)) best = i;
      return best;
    };
    const full = near(this.bitmaps);
    const proxy = near(this.pBitmaps);
    const dFull = full < 0 ? Infinity : Math.abs(full - f);
    const dProxy = proxy < 0 ? Infinity : Math.abs(proxy - f);
    // a full frame within a frame of the camera always wins; beyond that, whichever is truer to
    // where the camera is (a soft frame in the right place beats a sharp one from behind)
    if (dFull <= 1 || dFull <= dProxy) return full < 0 ? null : { img: this.bitmaps.get(full)!, frame: full, proxy: false };
    return { img: this.pBitmaps.get(proxy)!, frame: proxy, proxy: true };
  }

  private blit(img: ImageBitmap, frame: number) {
    const { canvas, ctx } = this;
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / img.width, ch / img.height);
    const sw = cw / scale;
    const sh = ch / scale;
    // object-fit: cover, held on the subject; sm frames are already cut round it
    // sm and xp frames are already cut round the subject
    const fx = img.width < img.height ? 0.5 : focusAt(frame);
    const sx = Math.min(Math.max(img.width * fx - sw / 2, 0), img.width - sw);
    ctx.drawImage(img, sx, (img.height - sh) / 2, sw, sh, 0, 0, cw, ch);
  }

  private draw() {
    const got = this.pick();
    if (!got) return; // nothing loaded yet: the poster underneath stays
    // keep asking until the exact full frame is what is on screen
    this.dirty = got.frame !== this.frame || got.proxy;
    const { canvas, ctx } = this;
    const hd = this.hd && this.hd.frame === this.frame && got.frame === this.frame && !got.proxy ? this.hd : null;
    const fade = hd ? Math.min(1, (performance.now() - hd.since) / FADE_MS) : 0;
    const key = `${got.proxy ? 'p' : this.tier}${got.frame}|${hd ? fade.toFixed(3) : ''}|${canvas.width}x${canvas.height}`;
    if (key === this.drawn) return;
    this.drawn = key;
    this.shown = got.frame;
    this.shownProxy = got.proxy;
    ctx.imageSmoothingQuality = this.speed === 0 ? 'high' : 'medium';
    if (fade < 1) this.blit(got.img, got.frame);
    if (hd) {
      // ease the sharper frame in: no visible switch between moving and resting
      ctx.globalAlpha = fade * fade * (3 - 2 * fade);
      this.blit(hd.bm, hd.frame);
      ctx.globalAlpha = 1;
    }
    if (!this.first) {
      this.first = true;
      this.onFirstFrame();
      this.pumpProxies();
      if (this.refineAtRest) this.restTimer = window.setTimeout(() => this.refine(), REST_MS * 4);
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
