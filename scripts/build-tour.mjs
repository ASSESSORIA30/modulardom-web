#!/usr/bin/env node
/*
  build-tour.mjs — turns the source clips into the scroll-driven tour.

    node scripts/build-tour.mjs            frames + motion map + stills
    node scripts/build-tour.mjs --stills   only the editorial stills
    node scripts/build-tour.mjs --map      only the motion map

  Reads media/tour.json. The source clips are only ever read.

  The cut   Clip 1 ends on four frames that jump back to a still image, and clip 2 opens on that
            same still before its camera carries on. Dropping both (the `from`/`to` of each clip)
            leaves one continuous move: a straight cut, nothing blended.

  Writes    public/tour/md/0001.avif …   1920x1080   what the scroll scrubs on landscape screens
            public/tour/sm/0001.avif …   864x1536    phones, cropped round a focal point that
                                                     follows the subject (media/tour.json `focus`)
            public/tour/hd/0001.avif …   2560x1440   one frame at a time, swapped in when the
                                                     scroll rests on a large or dense screen
            public/stills/<name>.webp                crops of single frames for the editorial pages
            src/content/tour.json                    frame count, focus track, motion map

  Motion map  The clips ease in and out; mapped linearly, the scroll would crawl through those
              parts. `map[i]` is frame i's place on a 0 → 1 line where equal steps are (nearly)
              equal camera travel, so the same wheel turn always moves the camera about as far.

  Needs ffmpeg. Output is committed, so Vercel never runs this.
*/
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'media', 'tour.json'), 'utf8'));
const OUT = path.join(ROOT, 'public', 'tour');
const STILLS = path.join(ROOT, 'public', 'stills');
const MANIFEST = path.join(ROOT, 'src', 'content', 'tour.json');
const args = new Set(process.argv.slice(2));
const all = !args.has('--stills') && !args.has('--map');
// --tier=md|sm|hd limits a full run to one size

const TIERS = {
  md: { w: 1920, h: 1080, q: 52 },
  sm: { w: 864, h: 1536, q: 52 },
  hd: { w: 2560, h: 1440, q: 56 },
};
const SHARP = 'unsharp=3:3:0.3:3:3:0'; // a touch of acutance after the downscale, luma only

const ff = (a, opt = {}) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a], { stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 1 << 28, ...opt });
const clips = cfg.clips.map((c) => ({ ...c, file: path.join(ROOT, c.source), n: c.to - c.from + 1 }));
const total = clips.reduce((s, c) => s + c.n, 0);

/** focal x (0 → 1) at a frame of the joined tour */
function focusAt(frame) {
  const k = cfg.focus;
  if (frame <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (frame <= k[i][0]) {
      const [f0, x0] = k[i - 1];
      const [f1, x1] = k[i];
      return x0 + ((x1 - x0) * (frame - f0)) / (f1 - f0);
    }
  }
  return k[k.length - 1][1];
}

/** ffmpeg decodes, crops and scales; sharp encodes each raw frame to AVIF, four at a time */
function encodeTier(name, clip, offset, filter) {
  const { w, h, q } = TIERS[name];
  const size = w * h * 3;
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-v', 'error', '-i', clip.file, '-vf', `select='between(n,${clip.from},${clip.to})',setpts=N/TB,${filter},format=rgb24`, '-fps_mode', 'passthrough', '-f', 'rawvideo', '-'], { stdio: ['ignore', 'pipe', 'inherit'] });
    let buf = Buffer.alloc(0);
    let n = 0;
    let busy = 0;
    let ended = false;
    const done = () => ended && busy === 0 && resolve(n);
    p.stdout.on('data', (chunk) => {
      buf = buf.length ? Buffer.concat([buf, chunk]) : chunk;
      while (buf.length >= size) {
        const raw = Buffer.from(buf.subarray(0, size));
        buf = buf.subarray(size);
        const file = path.join(OUT, name, `${String(offset + ++n).padStart(4, '0')}.avif`);
        busy++;
        if (busy >= 5) p.stdout.pause();
        sharp(raw, { raw: { width: w, height: h, channels: 3 } })
          .avif({ quality: q, effort: 3, chromaSubsampling: '4:2:0' })
          .toFile(file)
          .then(() => {
            busy--;
            if (busy < 5) p.stdout.resume();
            done();
          }, reject);
      }
    });
    p.on('error', reject);
    p.stdout.on('end', () => {
      ended = true;
      done();
    });
  });
}

if (all) {
  const only = [...args].find((a) => a.startsWith('--tier='))?.slice(7);
  let offset = 0;
  for (const t of Object.keys(TIERS)) {
    if (only && only !== t) continue;
    fs.rmSync(path.join(OUT, t), { recursive: true, force: true });
    fs.mkdirSync(path.join(OUT, t), { recursive: true });
  }
  for (const c of clips) {
    const { sm, md, hd } = TIERS;
    // the sm crop is cut from the full-height 4K picture, its x following the focus track
    const cropW = Math.round((2160 * sm.w) / sm.h);
    let expr = String(Math.round(focusAt(offset + c.n - 1) * 3838 - cropW / 2));
    for (let i = c.n - 1; i > 0; i -= 6) {
      const a = Math.max(i - 6, 0);
      const xa = focusAt(offset + a) * 3838 - cropW / 2;
      const xb = focusAt(offset + i) * 3838 - cropW / 2;
      expr = `if(lte(n\\,${i})\\,${xa.toFixed(1)}+(${(xb - xa).toFixed(1)})*(n-${a})/${Math.max(i - a, 1)}\\,${expr})`;
    }
    const x = `min(max(${expr}\\,0)\\,${3838 - cropW})`;
    const filters = {
      md: `scale=${md.w}:${md.h}:flags=lanczos,${SHARP}`,
      sm: `crop=${cropW}:2160:${x}:0,scale=${sm.w}:${sm.h}:flags=lanczos,${SHARP}`,
      hd: `scale=${hd.w}:${hd.h}:flags=lanczos,${SHARP}`,
    };
    for (const t of Object.keys(TIERS)) {
      if (only && only !== t) continue;
      const n = await encodeTier(t, c, offset, filters[t]);
      console.log(`${t}: ${c.source.slice(0, 24)}… frames ${offset + 1}–${offset + n}`);
    }
    offset += c.n;
  }
}

if ((all && ![...args].some((a) => a.startsWith('--tier='))) || args.has('--map')) {
  // camera travel per frame: mean absolute difference between neighbours at low resolution
  const travel = [];
  for (const c of clips) {
    const txt = ff(['-i', c.file, '-vf', `select='between(n,${c.from},${c.to})',scale=320:180,format=gray,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-`, '-f', 'null', '-']).toString();
    const d = [...txt.matchAll(/YAVG=([\d.]+)/g)].map((m) => +m[1]);
    travel.push(...d, d[d.length - 1]); // tblend yields n-1 values; the cut itself counts as one more step
  }
  travel.length = total - 1;
  // smooth, then soften the extremes: keep a trace of the original easing instead of a robotic glide
  const smooth = travel.map((_, i) => {
    const w = travel.slice(Math.max(0, i - 4), i + 5);
    return w.reduce((s, v) => s + v, 0) / w.length;
  });
  const steps = smooth.map((v) => Math.pow(Math.max(v, 0.5), cfg.evenness ?? 0.7));
  const sum = steps.reduce((s, v) => s + v, 0);
  let acc = 0;
  const map = [0, ...steps.map((v) => +((acc += v) / sum).toFixed(5))];
  map[map.length - 1] = 1;
  const focus = cfg.focus;
  fs.writeFileSync(MANIFEST, JSON.stringify({ count: total, fps: cfg.fps, tiers: TIERS, focus, map }) + '\n');
  console.log(`tour.json: ${total} frames`);
}

if ((all && ![...args].some((a) => a.startsWith('--tier='))) || args.has('--stills')) {
  fs.mkdirSync(STILLS, { recursive: true });
  for (const s of cfg.stills) {
    // s.frame is a frame of the joined tour; find its clip
    let f = s.frame - 1;
    let clip = clips[0];
    for (const c of clips) {
      if (f < c.n) {
        clip = c;
        break;
      }
      f -= c.n;
    }
    const [cx, cy, cw, ch] = s.crop ?? [0, 0, 1, 1];
    const crop = `crop=${Math.round(cw * 3838)}:${Math.round(ch * 2160)}:${Math.round(cx * 3838)}:${Math.round(cy * 2160)}`;
    ff(['-i', clip.file, '-vf', `select='eq(n,${clip.from + f})',${crop},scale=${s.width}:-2:flags=lanczos,${SHARP},format=yuv420p`, '-frames:v', '1', '-c:v', 'libwebp', '-quality', String(s.quality ?? 84), '-compression_level', '6', path.join(STILLS, `${s.name}.webp`)]);
  }
  // sizes for the page, so pictures reserve their space before they load
  const meta = {};
  for (const f of fs.readdirSync(STILLS).filter((f) => f.endsWith('.webp')).sort()) {
    const { width, height } = await sharp(path.join(STILLS, f)).metadata();
    meta[f.replace('.webp', '')] = { w: width, h: height };
  }
  fs.writeFileSync(path.join(ROOT, 'src', 'content', 'stills.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log(`stills: ${cfg.stills.length}`);
}
