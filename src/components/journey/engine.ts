import { frameUrl } from '@/content/scenes';
import { currentScene, sample, smooth } from './timeline';

/*
  FrameEngine — draws the tour on one canvas.

  Loading   Only the scene on screen and its neighbour(s) are ever held. Each scene loads coarse to
            fine (every 16th frame, then 8th … then all), so the whole clip can be scrubbed within
            moments and sharpens as the rest arrives. Until the exact frame is in, the nearest
            loaded one is drawn.
  Memory    Scenes further away are dropped; their files stay in the HTTP cache, so coming back
            costs a decode, not a download.
  Variants  lg (16:9) for landscape viewports, sm (square crop round the focal point) for portrait.
*/

export type EngineScene = { id: string; count: number; focusX: number };
type Variant = 'lg' | 'sm';

const MAX_PARALLEL = 6;
const STRIDES = [16, 8, 4, 2, 1];

class Sequence {
  imgs: (HTMLImageElement | undefined)[];
  private order: number[] = [];
  private cursor = 0;
  loaded = 0;
  alive = true;

  constructor(
    readonly scene: EngineScene,
    readonly variant: Variant,
    minStride: number,
  ) {
    const n = scene.count;
    this.imgs = new Array(n);
    const seen = new Set<number>();
    const push = (i: number) => {
      if (!seen.has(i)) {
        seen.add(i);
        this.order.push(i);
      }
    };
    push(0);
    push(n - 1);
    for (const s of STRIDES) {
      if (s < minStride) break;
      for (let i = 0; i < n; i += s) push(i);
    }
  }

  next(): number | null {
    return this.cursor < this.order.length ? this.order[this.cursor++] : null;
  }

  nearest(i: number): HTMLImageElement | undefined {
    if (this.imgs[i]) return this.imgs[i];
    for (let d = 1; d < this.scene.count; d++) {
      const a = this.imgs[i - d];
      if (a) return a;
      const b = this.imgs[i + d];
      if (b) return b;
    }
    return undefined;
  }
}

export class FrameEngine {
  private ctx: CanvasRenderingContext2D;
  private seqs = new Map<number, Sequence>();
  private variant: Variant = 'lg';
  private active = 0;
  private t = 0;
  private dir = 1;
  private raf = 0;
  private lastKey = '';
  private first = false;
  private dead = false;
  private readonly lean: boolean;
  private readonly minStride: number;

  constructor(
    private canvas: HTMLCanvasElement,
    private scenes: EngineScene[],
    private onFirstFrame: () => void,
  ) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const slow = !!nav.connection?.saveData || /2g/.test(nav.connection?.effectiveType ?? '');
    this.minStride = slow ? 2 : 1; // data saver: every other frame
    this.lean = slow || (nav.deviceMemory ?? 8) <= 4;
    this.resize();
  }

  /** true while the first scene has too little loaded to scrub */
  get loadedRatio() {
    const s = this.seqs.get(0);
    return s ? s.loaded / s.scene.count : 0;
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.canvas;
    if (!w || !h) return;
    const variant: Variant = w / h <= 1 ? 'sm' : 'lg';
    // the source is 720p: more canvas pixels than this buy nothing
    const cap = variant === 'lg' ? 1920 / w : 1440 / h;
    const scale = Math.min(window.devicePixelRatio || 1, 2, Math.max(1, cap));
    const cw = Math.round(w * scale);
    const ch = Math.round(h * scale);
    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
    }
    if (variant !== this.variant) {
      this.variant = variant;
      for (const s of this.seqs.values()) s.alive = false;
      this.seqs.clear();
    }
    this.lastKey = '';
    this.want();
    this.invalidate();
  }

  setTime(t: number) {
    if (t !== this.t) this.dir = t > this.t ? 1 : -1;
    this.t = t;
    this.want();
    this.invalidate();
  }

  destroy() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    for (const s of this.seqs.values()) s.alive = false;
    this.seqs.clear();
  }

  private invalidate() {
    if (!this.raf && !this.dead) this.raf = requestAnimationFrame(() => this.draw());
  }

  /** decide which scenes to hold, drop the rest, keep the queue moving */
  private want() {
    const n = this.scenes.length;
    const s = sample(this.t, n);
    const cur = currentScene(s);
    const wanted = [cur, s.scene, s.under, cur + this.dir, this.lean ? null : cur - this.dir].filter(
      (i, k, a): i is number => i !== null && i >= 0 && i < n && a.indexOf(i) === k,
    );
    for (const [i, seq] of this.seqs) {
      if (!wanted.includes(i)) {
        seq.alive = false;
        seq.imgs = [];
        this.seqs.delete(i);
      }
    }
    for (const i of wanted) {
      if (!this.seqs.has(i)) this.seqs.set(i, new Sequence(this.scenes[i], this.variant, this.minStride));
    }
    this.pump(wanted);
  }

  private pump(wanted: number[]) {
    while (this.active < MAX_PARALLEL) {
      let job: { seq: Sequence; i: number } | null = null;
      for (const w of wanted) {
        const seq = this.seqs.get(w);
        const i = seq?.next();
        if (seq && i != null) {
          job = { seq, i };
          break;
        }
      }
      if (!job) return;
      this.load(job.seq, job.i);
    }
  }

  private load(seq: Sequence, i: number) {
    this.active++;
    const img = new Image();
    img.decoding = 'async';
    const done = (ok: boolean) => {
      this.active--;
      if (this.dead) return;
      if (ok && seq.alive) {
        seq.imgs[i] = img;
        seq.loaded++;
        this.invalidate();
      }
      this.want();
    };
    img.onload = () => {
      // decode off the main thread so the first draw of a frame never stalls a scroll
      if (img.decode) img.decode().then(() => done(true), () => done(true));
      else done(true);
    };
    img.onerror = () => done(false);
    img.src = frameUrl(seq.scene.id, seq.variant, i + 1);
  }

  private frame(sceneIndex: number, p: number) {
    const seq = this.seqs.get(sceneIndex);
    if (!seq) return undefined;
    return seq.nearest(Math.round(p * (seq.scene.count - 1)));
  }

  private draw() {
    this.raf = 0;
    const s = sample(this.t, this.scenes.length);
    const top = this.frame(s.scene, s.p);
    const under = s.under !== null ? this.frame(s.under, s.underP) : undefined;
    // the swap happens in the middle 60% of the overlap, under the veil of light
    const alpha = s.under !== null ? smooth(Math.min(1, Math.max(0, (s.mix - 0.2) / 0.6))) : 1;
    if (!top && !under) return; // nothing loaded yet: keep what is on the canvas
    const key = `${top?.src}|${under?.src}|${alpha.toFixed(3)}|${this.canvas.width}x${this.canvas.height}`;
    if (key === this.lastKey) return;
    this.lastKey = key;

    const { ctx } = this;
    ctx.imageSmoothingQuality = 'high';
    if (under) this.cover(under, this.scenes[s.under!].focusX);
    if (top) {
      ctx.globalAlpha = under ? alpha : 1;
      this.cover(top, this.scenes[s.scene].focusX);
      ctx.globalAlpha = 1;
    }
    if (!this.first) {
      this.first = true;
      this.onFirstFrame();
    }
  }

  /** object-fit: cover, held on the scene's focal point */
  private cover(img: HTMLImageElement, focusX: number) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const sw = cw / scale;
    const sh = ch / scale;
    const fx = this.variant === 'sm' ? 0.5 : focusX; // sm is already cropped round the focus
    const sx = Math.min(Math.max(iw * fx - sw / 2, 0), iw - sw);
    this.ctx.drawImage(img, sx, (ih - sh) / 2, sw, sh, 0, 0, cw, ch);
  }
}
