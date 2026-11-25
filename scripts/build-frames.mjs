#!/usr/bin/env node
/*
  build-frames.mjs — turns the source clips in media/ into scroll-scrub frame sequences.

    node scripts/build-frames.mjs            build every scene missing from public/frames
    node scripts/build-frames.mjs --force    rebuild all
    node scripts/build-frames.mjs suite      build one scene by id

  Reads media/scenes.json ({ id, source, focusX }). Originals are never modified.
  Writes  public/frames/<id>/lg/0001.webp …  1280x720, landscape viewports
          public/frames/<id>/sm/0001.webp …  720x720 crop round focusX, portrait viewports
          public/frames/<id>/poster.jpg      first frame, for metadata and no-JS
          src/content/frames.json            manifest the app reads
  Needs ffmpeg on PATH. Frames are committed, so Vercel never runs this.
*/
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const MEDIA = path.join(ROOT, 'media');
const OUT = path.join(ROOT, 'public', 'frames');
const MANIFEST = path.join(ROOT, 'src', 'content', 'frames.json');
const LG = { w: 1280, h: 720, q: 80 };
const SM = { w: 720, h: 720, q: 76 };

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));
const scenes = JSON.parse(fs.readFileSync(path.join(MEDIA, 'scenes.json'), 'utf8'));
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};

const ff = (a) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a], { stdio: 'inherit' });
const count = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith('.webp')).length;

for (const s of scenes) {
  if (only.length && !only.includes(s.id)) continue;
  const src = path.join(MEDIA, s.source);
  const dir = path.join(OUT, s.id);
  if (!force && !only.length && manifest[s.id] && fs.existsSync(path.join(dir, 'lg'))) {
    console.log(`${s.id}: up to date`);
    continue;
  }
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'lg'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'sm'), { recursive: true });
  const base = `scale=${LG.w}:${LG.h}:flags=lanczos`;
  const x = Math.round(Math.min(Math.max(s.focusX * LG.w - SM.w / 2, 0), LG.w - SM.w));
  const webp = (q) => ['-c:v', 'libwebp', '-quality', String(q), '-compression_level', '6', '-fps_mode', 'passthrough'];
  ff(['-i', src, '-vf', base, ...webp(LG.q), path.join(dir, 'lg', '%04d.webp')]);
  ff(['-i', src, '-vf', `${base},crop=${SM.w}:${SM.h}:${x}:0`, ...webp(SM.q), path.join(dir, 'sm', '%04d.webp')]);
  ff(['-i', src, '-vf', base, '-frames:v', '1', '-q:v', '3', path.join(dir, 'poster.jpg')]);
  const n = count(path.join(dir, 'lg'));
  manifest[s.id] = { count: n, focusX: s.focusX, lg: [LG.w, LG.h], sm: [SM.w, SM.h] };
  console.log(`${s.id}: ${n} frames`);
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
