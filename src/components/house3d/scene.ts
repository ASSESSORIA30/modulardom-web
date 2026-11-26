import * as THREE from 'three';
import type { LayerId, SystemId } from '@/content/i18n';
import { makeEnvironment, makeTextures, worldUv } from './materials';

/*
  A conceptual house as an architect's presentation model, built in code and taken apart layer by
  layer.

  Geometry  Instanced boxes (blocks, studs, boards, panes): no model file.
  Light     Image-based lighting from a small environment generated at start (a dusk sky with a
            warm key and a cool fill, see materials.ts), one sun with soft shadows, and a contact
            shadow under the model. No HDR file is downloaded.
  Surface   PBR materials with procedural colour, roughness and relief maps, laid in world space
            so a board and a wall share the same grain scale; every block, stud and board carries a
            slight tint of its own, as cut material does.
  Honesty   Dimensions are compositional (they make the model read), never technical: nothing here
            states a real thickness, build-up or performance.

  Cost      The scene renders on demand: only while something is still moving towards its target.
            Shadows are redrawn only when geometry moves, not when the camera turns. If frames come
            slowly the scene steps its own quality down (resolution first, then sun shadows), so a
            modest GPU gets a lighter picture instead of a stuttering page.
  Used twice: the "layers" section (the scroll takes it apart) and the configurator (assembled, on
  its plot, answering the choices).
*/

export const LAYERS: LayerId[] = ['finishes', 'roof', 'insulation', 'envelope', 'services', 'structure', 'foundation'];

export type HouseConfig = {
  floors: 1 | 2;
  /** footprint stretch along the long side, 0.8 … 1.35 */
  width: number;
  system: SystemId;
  /** façade: stone throughout, or the upper volume in timber */
  finish: 'mineral' | 'wood';
  /** massing: one bar, or an L with a single-storey wing */
  volume: 'compact' | 'L';
  /** flat; 'mono' one slope falling to the front; 'gable' two slopes, ridge along the long side. Anything else reads as flat */
  roof: 'flat' | 'mono' | 'gable';
  pool: boolean;
  porch: boolean;
  garage: boolean;
  solar: boolean;
};

export const DEFAULT_CONFIG: HouseConfig = { floors: 2, width: 1, system: 'cellular', finish: 'mineral', volume: 'compact', roof: 'flat', pool: false, porch: false, garage: false, solar: false };

type Box = { p: [number, number, number]; s: [number, number, number] };
type Opening = { a: number; b: number; y0: number; y1: number; door?: boolean };
type Wall = { vol: 'G' | 'U'; s: [number, number]; d: [number, number]; n: [number, number]; len: number; y: number; h: number; open: Opening[] };

const ss = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// a fixed sequence, so the model looks the same on every visit
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

/* —— the house, as walls with openings —— */

const G = { x0: -6, x1: 6, z0: -4, z1: 4, y: 0, h: 3 };
const U = { x0: -6, x1: 2, z0: -4, z1: 2, y: 3.3, h: 2.8 };

function wallsOf(v: typeof G, vol: 'G' | 'U', open: Opening[][]): Wall[] {
  const w = v.x1 - v.x0;
  const d = v.z1 - v.z0;
  return [
    { vol, s: [v.x0, v.z1], d: [1, 0], n: [0, 1], len: w, y: v.y, h: v.h, open: open[0] }, // front
    { vol, s: [v.x1, v.z1], d: [0, -1], n: [1, 0], len: d, y: v.y, h: v.h, open: open[1] }, // right
    { vol, s: [v.x1, v.z0], d: [-1, 0], n: [0, -1], len: w, y: v.y, h: v.h, open: open[2] }, // back
    { vol, s: [v.x0, v.z0], d: [0, 1], n: [-1, 0], len: d, y: v.y, h: v.h, open: open[3] }, // left
  ];
}

const WALLS: Wall[] = [
  ...wallsOf(G, 'G', [
    [{ a: 0.8, b: 7.2, y0: 0.1, y1: 2.72 }, { a: 8.5, b: 10.1, y0: 0, y1: 2.6, door: true }],
    [{ a: 2.2, b: 5.8, y0: 0.9, y1: 2.5 }],
    [{ a: 1.5, b: 4, y0: 0.9, y1: 2.5 }, { a: 7, b: 10.5, y0: 0.9, y1: 2.5 }],
    [{ a: 1, b: 7, y0: 0.1, y1: 2.72 }],
  ]),
  ...wallsOf(U, 'U', [
    [{ a: 0.8, b: 7.2, y0: 0.1, y1: 2.5 }],
    [{ a: 1.5, b: 4.5, y0: 0.9, y1: 2.3 }],
    [{ a: 1.2, b: 3.4, y0: 0.9, y1: 2.3 }, { a: 4.8, b: 7, y0: 0.9, y1: 2.3 }],
    [{ a: 0.9, b: 5.1, y0: 0.1, y1: 2.5 }],
  ]),
];

/** solid parts of a wall, as [u0, u1, v0, v1] rectangles */
function solids(w: Wall): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  let u = 0;
  for (const o of [...w.open].sort((p, q) => p.a - q.a)) {
    if (o.a > u) out.push([u, o.a, 0, w.h]);
    if (o.y0 > 0.05) out.push([o.a, o.b, 0, o.y0]);
    if (o.y1 < w.h) out.push([o.a, o.b, o.y1, w.h]);
    u = o.b;
  }
  if (u < w.len) out.push([u, w.len, 0, w.h]);
  return out;
}

/** a box on a wall: along it [u0,u1], up [v0,v1], out from its line [off, off+th] */
function onWall(w: Wall, u0: number, u1: number, v0: number, v1: number, off: number, th: number): Box {
  const u = (u0 + u1) / 2;
  const k = off + th / 2;
  const along = u1 - u0;
  return {
    p: [w.s[0] + w.d[0] * u + w.n[0] * k, w.y + (v0 + v1) / 2, w.s[1] + w.d[1] * u + w.n[1] * k],
    s: w.d[0] !== 0 ? [along, v1 - v0, th] : [th, v1 - v0, along],
  };
}

/** a continuous layer outside the structure, corners closed; `course` cuts it into boards or slabs */
function skin(w: Wall, off: number, th: number, course = 0): Box[] {
  const out: Box[] = [];
  for (const [u0, u1, v0, v1] of solids(w)) {
    const a = u0 <= 0 ? -(off + th) : u0;
    const b = u1 >= w.len ? w.len + off + th : u1;
    if (!course) {
      out.push(onWall(w, a, b, v0, v1, off, th));
      continue;
    }
    // stone slabs / boards, with a hairline joint
    const n = Math.max(1, Math.round((b - a) / course));
    for (let i = 0; i < n; i++) out.push(onWall(w, a + ((b - a) * i) / n + 0.006, a + ((b - a) * (i + 1)) / n - 0.006, v0, v1, off, th));
  }
  return out;
}

const T = 0.3; // structural wall, compositional
function blocks(w: Wall): Box[] {
  const out: Box[] = [];
  const bl = 0.62;
  const bh = 0.25;
  const gap = 0.012;
  for (const [u0, u1, v0, v1] of solids(w)) {
    let row = Math.round(v0 / bh);
    for (let v = v0; v < v1 - 0.01; v += bh, row++) {
      const top = Math.min(v + bh, v1);
      let u = u0 - (row % 2 ? bl / 2 : 0);
      for (; u < u1 - 0.01; u += bl) {
        const a = Math.max(u, u0);
        const b = Math.min(u + bl, u1);
        if (b - a < 0.04) continue;
        out.push(onWall(w, a + gap / 2, b - gap / 2, v + gap / 2, top - gap / 2, -T, T));
      }
    }
  }
  return out;
}

function studs(w: Wall): Box[] {
  const out: Box[] = [];
  const sw = 0.065;
  const d = 0.2;
  const off = -d - 0.02;
  for (const [u0, u1, v0, v1] of solids(w)) {
    out.push(onWall(w, u0, u1, v0, v0 + sw, off, d), onWall(w, u0, u1, v1 - sw, v1, off, d));
    if (v1 - v0 > 1.6) out.push(onWall(w, u0, u1, (v0 + v1) / 2 - sw / 2, (v0 + v1) / 2 + sw / 2, off + 0.03, d - 0.06)); // noggings
    const n = Math.max(1, Math.round((u1 - u0) / 0.6));
    for (let i = 0; i <= n; i++) {
      const u = u0 + ((u1 - u0 - sw) * i) / n;
      out.push(onWall(w, u, u + sw, v0 + sw, v1 - sw, off, d));
    }
  }
  return out;
}

/** a window: glass set back in a reveal, a slim dark frame, tall panes, a stone sill */
function glazing(w: Wall): { glass: Box[]; frames: Box[]; doors: Box[]; sills: Box[]; reveals: Box[] } {
  const reveals: Box[] = [];
  const glass: Box[] = [];
  const frames: Box[] = [];
  const doors: Box[] = [];
  const sills: Box[] = [];
  const f = 0.055;
  for (const o of w.open) {
    if (o.door) {
      doors.push(onWall(w, o.a + f, o.b - f, o.y0 + 0.02, o.y1 - f, -0.02, 0.07));
      frames.push(onWall(w, o.b - 0.34, o.b - 0.3, 0.95, 1.75, 0.05, 0.05)); // pull handle
    } else {
      glass.push(onWall(w, o.a + f, o.b - f, o.y0 + f, o.y1 - f, -0.06, 0.03));
      const n = Math.max(1, Math.round((o.b - o.a) / 1.6));
      for (let i = 1; i < n; i++) {
        const u = o.a + ((o.b - o.a) * i) / n;
        frames.push(onWall(w, u - f / 2, u + f / 2, o.y0 + f, o.y1 - f, -0.1, 0.11));
      }
      if (o.y0 > 0.5) sills.push(onWall(w, o.a - 0.06, o.b + 0.06, o.y0 - 0.06, o.y0, 0.19, 0.14));
    }
    // the opening is lined in the façade material, so no inner layer shows at its edge
    const r = 0.035;
    reveals.push(
      onWall(w, o.a - r, o.a, o.y0, o.y1, -0.14, 0.39),
      onWall(w, o.b, o.b + r, o.y0, o.y1, -0.14, 0.39),
      onWall(w, o.a - r, o.b + r, o.y1, o.y1 + r, -0.14, 0.39),
    );
    if (o.y0 > 0.05) reveals.push(onWall(w, o.a - r, o.b + r, o.y0 - r, o.y0, -0.14, 0.39));
    // the frame sits in the reveal, behind the face of the wall
    frames.push(
      onWall(w, o.a, o.a + f, o.y0, o.y1, -0.12, 0.14),
      onWall(w, o.b - f, o.b, o.y0, o.y1, -0.12, 0.14),
      onWall(w, o.a, o.b, o.y1 - f, o.y1, -0.12, 0.14),
      onWall(w, o.a, o.b, o.y0, o.y0 + f, -0.12, 0.14),
    );
  }
  return { glass, frames, doors, sills, reveals };
}

/* —— scene —— */

type Part = { mesh: THREE.InstancedMesh; layer: LayerId; vol: 'G' | 'U' | 'base'; n: [number, number]; system?: SystemId; only?: 1 | 2; /** a flat roof plane or its coping: gives way to a pitched roof */ flat?: boolean; y0: number };

export type HouseScene = {
  /** 0 assembled → 1 fully apart */
  setProgress(t: number): void;
  setFocus(layer: LayerId | null): void;
  setConfig(c: Partial<HouseConfig>): void;
  /** radians added to the camera's turn (drag) */
  setTurn(a: number): void;
  /** the model as it stands, as a JPEG data URL (for the dossier) */
  snapshot(): string | null;
  resize(): void;
  setActive(on: boolean): void;
  dispose(): void;
};

/** hands the main thread back between the stages of building the model, so a scroll in progress never waits on it */
const breathe = () => new Promise<void>((r) => setTimeout(r, 0));

export async function createHouseScene(canvas: HTMLCanvasElement, opts: { mode: 'layers' | 'config' }): Promise<HouseScene> {
  seed = 7;
  const layers = opts.mode === 'layers';
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const scene = new THREE.Scene();
  const env = makeEnvironment(renderer);
  scene.environment = env;
  scene.environmentIntensity = 0.9;
  await breathe();
  const tex = makeTextures();
  await breathe();
  const camera = new THREE.PerspectiveCamera(21, 1, 1, 260);
  const root = new THREE.Group(); // the house: stretches with the chosen surface
  const site = new THREE.Group(); // the plot: stays put
  scene.add(root, site);

  const sun = new THREE.DirectionalLight(0xffdcb0, 2.3);
  sun.position.set(13, 21, 17);
  sun.castShadow = true;
  // a 4096 map only where it is cheap: dense screens on machines with cores to spare
  const big = !small && (window.devicePixelRatio || 1) >= 2 && (navigator.hardwareConcurrency || 4) >= 8;
  sun.shadow.mapSize.setScalar(big ? 4096 : 2048);
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.025;
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 90 });
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xa9d2e2, 0.5);
  rim.position.set(-18, 10, -14);
  scene.add(rim);

  const unit = new THREE.BoxGeometry(1, 1, 1);
  const disposables: { dispose(): void }[] = [unit, env, ...Object.values(tex)];

  type Mat = { m: THREE.MeshStandardMaterial; base: THREE.Color; layer: LayerId; alpha: number; system?: SystemId };
  const mats = new Map<string, Mat>();
  const mat = (key: string, layer: LayerId, color: number, p: THREE.MeshStandardMaterialParameters = {}, tile = 0, system?: SystemId) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...p });
    if (tile) worldUv(m, tile);
    mats.set(key, { m, base: new THREE.Color(color), layer, alpha: p.opacity ?? 1, system });
    disposables.push(m);
    return m;
  };
  const M = {
    foundation: mat('foundation', 'foundation', 0xa7a59e, { roughness: 0.95, map: tex.mottle, bumpMap: tex.grit, bumpScale: 1.2 }, 0.35),
    block: mat('block', 'structure', 0xf4f2ec, { roughness: 0.96, bumpMap: tex.grit, bumpScale: 0.9 }, 1.6, 'cellular'),
    slab: mat('slab', 'structure', 0xe2dfd6, { roughness: 0.94, map: tex.mottle, bumpMap: tex.grit, bumpScale: 0.8 }, 0.4, 'cellular'),
    timber: mat('timber', 'structure', 0xd9a765, { roughness: 0.62, map: tex.grain, bumpMap: tex.grain, bumpScale: 0.5 }, 1.1, 'timber'),
    envelope: mat('envelope', 'envelope', 0xc4bcab, { roughness: 0.8, map: tex.board, bumpMap: tex.grit, bumpScale: 0.5 }, 0.55),
    insulation: mat('insulation', 'insulation', 0xdcc98a, { roughness: 1, map: tex.fibre, bumpMap: tex.fibre, bumpScale: 2.2 }, 0.8),
    copper: mat('copper', 'services', 0xc98045, { roughness: 0.32, metalness: 0.9, envMapIntensity: 1.3 }),
    water: mat('water', 'services', 0x3f9e97, { roughness: 0.4, metalness: 0.1 }),
    duct: mat('duct', 'services', 0xc8ccd0, { roughness: 0.3, metalness: 0.85, envMapIntensity: 1.2 }),
    roof: mat('roof', 'roof', 0x676d6e, { roughness: 0.95, map: tex.mottle, bumpMap: tex.grit, bumpScale: 1.6 }, 0.6),
    coping: mat('coping', 'roof', 0x2a2f31, { roughness: 0.45, metalness: 0.6 }),
    skin: mat('skin', 'finishes', 0xf1e7d6, { roughness: 0.7, map: tex.stone, bumpMap: tex.grit, bumpScale: 0.45 }, 0.3),
    reveal: mat('reveal', 'finishes', 0xe9dfcd, { roughness: 0.75 }),
    skinU: mat('skinU', 'finishes', 0xf1e7d6, { roughness: 0.7, map: tex.stone, bumpMap: tex.grit, bumpScale: 0.45 }, 0.3),
    glass: mat('glass', 'finishes', 0x1c2a31, { roughness: 0.04, metalness: 0, transparent: true, opacity: 0.46, envMapIntensity: 2.4 }),
    frame: mat('frame', 'finishes', 0x191d1f, { roughness: 0.42, metalness: 0.7 }),
    oak: mat('oak', 'finishes', 0x9c6b42, { roughness: 0.55, map: tex.grain, bumpMap: tex.grain, bumpScale: 0.4 }, 0.9),
  };

  const parts: Part[] = [];
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  /** `vary`: how much each piece's tone differs from its neighbours */
  const add = (boxes: Box[], material: THREE.Material, p: Omit<Part, 'mesh' | 'y0'>, vary = 0, shadow = true) => {
    if (!boxes.length) return;
    const mesh = new THREE.InstancedMesh(unit, material, boxes.length);
    boxes.forEach((b, i) => {
      dummy.position.set(...b.p);
      dummy.scale.set(...b.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (vary) {
        const k = 1 - vary / 2 + rnd() * vary;
        mesh.setColorAt(i, tint.setRGB(k, k * (1 - rnd() * vary * 0.25), k * (1 - rnd() * vary * 0.5)));
      }
    });
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    root.add(mesh);
    parts.push({ mesh, y0: p.vol === 'U' ? U.y : 0, ...p });
  };

  // walls, layer by layer
  for (const w of WALLS) {
    await breathe();
    const base = { vol: w.vol, n: w.n } as const;
    add(blocks(w), M.block, { ...base, layer: 'structure', system: 'cellular' }, 0.07);
    add(studs(w), M.timber, { ...base, layer: 'structure', system: 'timber' }, 0.16);
    add(skin(w, 0, 0.05, 1.2), M.envelope, { ...base, layer: 'envelope' }, 0.08);
    add(skin(w, 0.05, 0.14, 0.6), M.insulation, { ...base, layer: 'insulation' }, 0.1);
    add(skin(w, 0.19, 0.06, 1.5), w.vol === 'U' ? M.skinU : M.skin, { ...base, layer: 'finishes' }, 0.045);
    const g = glazing(w);
    add(g.glass, M.glass, { ...base, layer: 'finishes' }, 0, false);
    add(g.frames, M.frame, { ...base, layer: 'finishes' });
    add(g.doors, M.oak, { ...base, layer: 'finishes' }, 0.05);
    add(g.sills, w.vol === 'U' ? M.skinU : M.skin, { ...base, layer: 'finishes' });
    add(g.reveals, M.reveal, { ...base, layer: 'finishes' });
  }

  // foundation: a slab on strip footings
  const none: [number, number] = [0, 0];
  add(
    [
      { p: [0, -0.18, 0], s: [12.9, 0.36, 8.9] },
      { p: [0, -0.7, 4.1], s: [12.9, 0.68, 0.7] },
      { p: [0, -0.7, -4.1], s: [12.9, 0.68, 0.7] },
      { p: [-6.1, -0.7, 0], s: [0.7, 0.68, 7.5] },
      { p: [6.1, -0.7, 0], s: [0.7, 0.68, 7.5] },
      { p: [2, -0.7, 0], s: [0.7, 0.68, 7.5] },
    ],
    M.foundation,
    { layer: 'foundation', vol: 'base', n: none },
  );

  // floors: solid slabs in aerated concrete, joists and deck in timber
  const joists = (x0: number, x1: number, z0: number, z1: number, y: number): Box[] => {
    const out: Box[] = [];
    for (let x = x0 + 0.04; x <= x1; x += 0.6) out.push({ p: [x, y, (z0 + z1) / 2], s: [0.07, 0.26, z1 - z0] });
    out.push({ p: [(x0 + x1) / 2, y, z0 + 0.04], s: [x1 - x0, 0.26, 0.07] }, { p: [(x0 + x1) / 2, y, z1 - 0.04], s: [x1 - x0, 0.26, 0.07] });
    return out;
  };
  add([{ p: [0, 3.15, 0], s: [12, 0.3, 8] }], M.slab, { layer: 'structure', vol: 'G', n: none, system: 'cellular' });
  add(joists(-6, 6, -4, 4, 3.15), M.timber, { layer: 'structure', vol: 'G', n: none, system: 'timber' }, 0.16);
  add([{ p: [-2, 6.25, -1], s: [8, 0.3, 6] }], M.slab, { layer: 'structure', vol: 'U', n: none, system: 'cellular' });
  add(joists(-6, 2, -4, 2, 6.25), M.timber, { layer: 'structure', vol: 'U', n: none, system: 'timber' }, 0.16);

  // roofs: a thin oversailing plane with a dark metal edge; the terrace has a deck and a glass guard
  const edge = (x: number, y: number, z: number, w: number, d: number): Box[] => [
    { p: [x, y, z - d / 2], s: [w + 0.06, 0.16, 0.06] },
    { p: [x, y, z + d / 2], s: [w + 0.06, 0.16, 0.06] },
    { p: [x - w / 2, y, z], s: [0.06, 0.16, d + 0.06] },
    { p: [x + w / 2, y, z], s: [0.06, 0.16, d + 0.06] },
  ];
  add([{ p: [-2, 6.5, -0.7], s: [9.5, 0.16, 7.7] }], M.roof, { layer: 'roof', vol: 'U', n: none, only: 2, flat: true });
  add(edge(-2, 6.5, -0.7, 9.5, 7.7), M.coping, { layer: 'roof', vol: 'U', n: none, only: 2, flat: true });
  const deck: Box[] = [];
  for (let z = -3.84; z < 3.9; z += 0.22) deck.push({ p: [4, 3.34, z], s: [3.76, 0.05, 0.2] });
  for (let z = 2.16; z < 3.9; z += 0.22) deck.push({ p: [-2, 3.34, z], s: [7.76, 0.05, 0.2] });
  add(deck, M.oak, { layer: 'roof', vol: 'G', n: none, only: 2 }, 0.14);
  add(
    [
      { p: [6.02, 3.86, 0], s: [0.025, 0.96, 8.1] },
      { p: [0, 3.86, 4.02], s: [12.1, 0.96, 0.025] },
    ],
    M.glass,
    { layer: 'roof', vol: 'G', n: none, only: 2 },
    0,
    false,
  );
  add(edge(0, 3.36, 0, 12.4, 8.4), M.coping, { layer: 'roof', vol: 'G', n: none, only: 2 });
  add([{ p: [0, 3.4, 0.5], s: [13.5, 0.16, 9.7] }], M.roof, { layer: 'roof', vol: 'G', n: none, only: 1, flat: true });
  add(edge(0, 3.4, 0.5, 13.5, 9.7), M.coping, { layer: 'roof', vol: 'G', n: none, only: 1, flat: true });

  // services: heating loops in the floor, risers, a duct, conduits round the rooms
  const loops = (x0: number, x1: number, z0: number, z1: number, y: number): Box[] => {
    const out: Box[] = [];
    let flip = false;
    for (let x = x0; x <= x1; x += 0.4, flip = !flip) {
      out.push({ p: [x, y, (z0 + z1) / 2], s: [0.045, 0.045, z1 - z0] });
      if (x + 0.4 <= x1) out.push({ p: [x + 0.2, y, flip ? z0 : z1], s: [0.445, 0.045, 0.045] });
    }
    return out;
  };
  add(loops(-5.3, 5.3, -3.3, 3.3, 0.05), M.copper, { layer: 'services', vol: 'G', n: none }, 0, false);
  add(loops(-5.3, 1.3, -3.3, 1.3, 3.36), M.copper, { layer: 'services', vol: 'U', n: none }, 0, false);
  add(
    [
      { p: [1.4, 1.5, -3.4], s: [0.08, 3, 0.08] },
      { p: [1.62, 1.5, -3.4], s: [0.08, 3, 0.08] },
      { p: [-1.6, 0.35, -3.4], s: [6, 0.08, 0.08] },
      { p: [-4.6, 0.7, -3.4], s: [0.08, 0.8, 0.08] },
    ],
    M.water,
    { layer: 'services', vol: 'G', n: none },
    0,
    false,
  );
  add(
    [
      { p: [0, 2.72, -1.2], s: [10.4, 0.22, 0.4] },
      { p: [3.2, 2.72, 1], s: [0.4, 0.22, 4.4] },
      { p: [-3.4, 2.72, 1], s: [0.4, 0.22, 4.4] },
    ],
    M.duct,
    { layer: 'services', vol: 'G', n: none },
  );
  add(
    [
      { p: [-2, 5.88, -1], s: [6.6, 0.2, 0.36] },
      { p: [1.52, 4.7, -3.4], s: [0.08, 2.8, 0.08] },
    ],
    M.duct,
    { layer: 'services', vol: 'U', n: none },
  );

  await breathe();

  /* —— the ground the model stands on —— */
  // a contact shadow: the soft dark where the model meets its base, independent of the sun
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(34, 28), new THREE.MeshBasicMaterial({ map: tex.contact, transparent: true, depthWrite: false, opacity: layers ? 0.75 : 0.55, toneMapped: false }));
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.012;
  const catcher = new THREE.Mesh(new THREE.CircleGeometry(60, 48), new THREE.ShadowMaterial({ opacity: layers ? 0.4 : 0.32 }));
  catcher.rotation.x = -Math.PI / 2;
  catcher.position.y = 0.01;
  catcher.receiveShadow = true;
  disposables.push(contact.geometry, contact.material as THREE.Material, catcher.geometry, catcher.material as THREE.Material);
  scene.add(contact);

  const solid = (g: THREE.Group, boxes: (Box & { m: THREE.Material })[], shadow = true) => {
    for (const b of boxes) {
      const mesh = new THREE.Mesh(unit, b.m);
      mesh.position.set(...b.p);
      mesh.scale.set(...b.s);
      mesh.castShadow = shadow;
      mesh.receiveShadow = true;
      g.add(mesh);
    }
    return g;
  };
  const extraMat = (color: number, p: THREE.MeshStandardMaterialParameters = {}, tile = 0) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...p });
    if (tile) worldUv(m, tile);
    disposables.push(m);
    return m;
  };

  const extras = { pool: new THREE.Group(), porch: new THREE.Group(), garage: new THREE.Group(), wing: new THREE.Group() };
  // roofs and solar panels of the configurator, per volume: all built once, shown by setConfig
  type Pitched = { g: THREE.Group; panels: THREE.Object3D };
  const roofs: { vol: 'G' | 'U'; mono: Pitched; gable: Pitched; flatSolar: THREE.Group }[] = [];

  if (!layers) {
    // the plot: a base like a presentation model's, lawn, a paved terrace, a path, trees
    const baseM = extraMat(0x23211f, { roughness: 0.5, metalness: 0.1 });
    const lawn = extraMat(0x8a8f7c, { roughness: 1, map: tex.fibre, bumpMap: tex.fibre, bumpScale: 2 }, 0.45);
    const paving = extraMat(0xe6dccb, { roughness: 0.75, map: tex.stone, bumpMap: tex.grit, bumpScale: 0.4 }, 0.3);
    solid(site, [
      { p: [0, -0.62, 2], s: [38, 1, 30], m: baseM },
      { p: [0, -0.07, 2], s: [37.4, 0.12, 29.4], m: lawn },
      { p: [0, -0.02, 6.4], s: [16.5, 0.1, 5.4], m: paving },
      { p: [9.3, -0.02, 12.2], s: [1.7, 0.1, 8.8], m: paving },
    ]);
    // trees as a model-maker makes them: a stem and a quiet crown
    const stem = new THREE.CylinderGeometry(0.07, 0.1, 1, 8);
    const crown = new THREE.SphereGeometry(1, 28, 20);
    const leaf = extraMat(0x8d927f, { roughness: 1, bumpMap: tex.grit, bumpScale: 1.5 });
    const bark = extraMat(0x4b4138, { roughness: 0.9 });
    disposables.push(stem, crown);
    for (const [x, z, h, r] of [[-14.5, 9.5, 3.8, 1.9], [-16, -5, 4.8, 2.4], [15, -7.5, 4.2, 2.1], [16, 7, 3.2, 1.6], [-10.5, -10, 3.4, 1.7]] as const) {
      const t = new THREE.Mesh(stem, bark);
      t.scale.set(1, h, 1);
      t.position.set(x, h / 2, z);
      const c = new THREE.Mesh(crown, leaf);
      c.scale.set(r, r * 0.86, r);
      c.position.set(x, h + r * 0.55, z);
      c.rotation.y = x;
      t.castShadow = c.castShadow = true;
      site.add(t, c);
    }
    catcher.position.y = 0.045;
    contact.position.y = 0.05;

    const poolWater = extraMat(0x2f8f8a, { roughness: 0.04, metalness: 0, envMapIntensity: 2, transparent: true, opacity: 0.92 });
    const dark = extraMat(0x1a1f24, { roughness: 0.25, metalness: 0.7, envMapIntensity: 1.6 });
    solid(extras.pool, [
      { p: [-2.4, 0.06, 11.6], s: [10.6, 0.14, 4.6], m: paving },
      { p: [-2.4, 0.1, 11.6], s: [9.4, 0.1, 3.4], m: poolWater },
    ], false);
    // pergola: posts, beams and a run of slats
    const slats: (Box & { m: THREE.Material })[] = [];
    for (let x = 6.5; x < 10.6; x += 0.32) slats.push({ p: [x, 2.98, 1], s: [0.07, 0.12, 5.6], m: M.oak });
    solid(extras.porch, [
      { p: [8.5, 2.86, 3.75], s: [4.4, 0.16, 0.12], m: M.frame },
      { p: [8.5, 2.86, -1.75], s: [4.4, 0.16, 0.12], m: M.frame },
      { p: [10.6, 1.45, 3.75], s: [0.12, 2.9, 0.12], m: M.frame },
      { p: [10.6, 1.45, -1.75], s: [0.12, 2.9, 0.12], m: M.frame },
      { p: [8.5, 0.04, 1], s: [4.7, 0.1, 6], m: paving },
      ...slats,
    ]);
    solid(extras.garage, [
      { p: [-9.4, 1.35, -1.2], s: [5.6, 2.7, 5.6], m: M.skin },
      { p: [-9.4, 2.78, -1.2], s: [6, 0.16, 6], m: M.roof },
      { p: [-9.4, 1.15, 1.63], s: [4.2, 2.3, 0.06], m: M.frame },
      { p: [-9.4, 0.02, 5.4], s: [4.4, 0.1, 7.4], m: paving },
    ]);
    // the wing of an L-shaped house: one storey, glazed to the garden
    solid(extras.wing, [
      { p: [3.2, 1.5, -7.6], s: [5.6, 3, 7.2], m: M.skin },
      { p: [3.2, 3.1, -7.6], s: [6.2, 0.16, 7.8], m: M.roof },
      { p: [6.02, 1.45, -7.6], s: [0.05, 2.5, 5.2], m: M.glass },
      { p: [6.04, 1.45, -5.9], s: [0.07, 2.5, 0.06], m: M.frame },
      { p: [6.04, 1.45, -7.6], s: [0.07, 2.5, 0.06], m: M.frame },
      { p: [6.04, 1.45, -9.3], s: [0.07, 2.5, 0.06], m: M.frame },
    ]);
    for (const g of Object.values(extras)) {
      g.visible = false;
      root.add(g);
    }
    /* —— pitched roofs: standing-seam metal over a wall that rises to meet it —— */
    const roofMetal = extraMat(0x454b4e, { roughness: 0.52, metalness: 0.55, envMapIntensity: 0.9 });
    const RT = 0.1; // roof sheet, compositional
    const SEAM = 0.04;
    const PITCH = { mono: 0.17, gable: 0.34 }; // rise per metre
    const o3 = new THREE.Object3D();
    const inst = (parent: THREE.Object3D, material: THREE.Material, n: number, place: (i: number) => void, shadow = true) => {
      const mesh = new THREE.InstancedMesh(unit, material, n);
      for (let i = 0; i < n; i++) {
        o3.rotation.set(0, 0, 0);
        place(i);
        o3.updateMatrix();
        mesh.setMatrixAt(i, o3.matrix);
      }
      mesh.castShadow = shadow;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    /** a convex outline in (z, y), carried from x0 to x1 */
    const prism = (pts: [number, number][], x0: number, x1: number) => {
      const pos: number[] = [];
      const c = new THREE.Vector3((x0 + x1) / 2, pts.reduce((q, p) => q + p[1], 0) / pts.length, pts.reduce((q, p) => q + p[0], 0) / pts.length);
      const A = new THREE.Vector3();
      const B = new THREE.Vector3();
      const C = new THREE.Vector3();
      const nrm = new THREE.Vector3();
      const tri = (a: number[], b: number[], d: number[]) => {
        A.fromArray(a);
        B.fromArray(b);
        C.fromArray(d);
        nrm.subVectors(B, A).cross(C.clone().sub(A));
        const outward = nrm.dot(A.clone().sub(c)) >= 0;
        pos.push(...a, ...(outward ? b : d), ...(outward ? d : b));
      };
      const at = (x: number, i: number) => [x, pts[i][1], pts[i][0]];
      const n = pts.length;
      for (let i = 1; i < n - 1; i++) {
        tri(at(x0, 0), at(x0, i), at(x0, i + 1));
        tri(at(x1, 0), at(x1, i), at(x1, i + 1));
      }
      for (let i = 1; i < n; i++) {
        // every side but the underside, which nothing sees
        const j = (i + 1) % n;
        tri(at(x0, i), at(x1, i), at(x1, j));
        tri(at(x0, i), at(x1, j), at(x0, j));
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.computeVertexNormals();
      disposables.push(geo);
      return geo;
    };
    /** one slope, given the low and high ends of its underside as [z, y]; local z runs along the fall */
    const slope = (g: THREE.Group, xa: number, xb: number, low: [number, number], high: [number, number], mitre: boolean) => {
      const dir = Math.sign(low[0] - high[0]);
      const run = Math.abs(low[0] - high[0]);
      const rise = high[1] - low[1];
      const len = Math.hypot(run, rise);
      const p = Math.atan2(rise, run);
      const pivot = new THREE.Group();
      pivot.position.set((xa + xb) / 2, (low[1] + high[1]) / 2, (low[0] + high[0]) / 2);
      pivot.rotation.x = dir * p;
      const e = mitre ? RT * Math.tan(p) : 0; // so the two sheets of a gable meet at their top edges
      const w = xb - xa;
      solid(pivot, [{ p: [0, RT / 2, (-dir * e) / 2], s: [w, RT, len + e], m: roofMetal }]);
      const n = Math.round(w / 0.6);
      inst(pivot, roofMetal, n + 1, (i) => {
        o3.position.set(-w / 2 + 0.02 + ((w - 0.04) * i) / n, RT + SEAM / 2, (-dir * e) / 2);
        o3.scale.set(0.035, SEAM, len + e);
      }, false);
      g.add(pivot);
      return pivot;
    };
    /** panels lying in a slope, a hand above the seams */
    const panelsOn = (pivot: THREE.Group, cols: number, rows: number, sx: number, sz: number, dz = 0) => {
      const m = inst(pivot, dark, cols * rows, (i) => {
        o3.position.set((i % cols - (cols - 1) / 2) * (sx + 0.08), RT + SEAM + 0.03, dz + (Math.floor(i / cols) - (rows - 1) / 2) * (sz + 0.08));
        o3.scale.set(sx, 0.04, sz);
      });
      m.visible = false;
      return m;
    };
    /** panels on a flat roof: two rows on low frames, tilted to the front */
    const panelsFlat = (cx: number, cz: number, top: number) => {
      const g = new THREE.Group();
      const tilt = THREE.MathUtils.degToRad(10);
      const half = 0.9;
      const back = 0.05 + 2 * half * Math.sin(tilt);
      inst(g, dark, 8, (i) => {
        o3.position.set(cx + ((i % 4) - 1.5) * 1.23, top + 0.07 + half * Math.sin(tilt), cz + (Math.floor(i / 4) - 0.5) * 2.8);
        o3.rotation.x = tilt;
        o3.scale.set(1.15, 0.04, 2 * half);
      });
      inst(g, M.frame, 14, (i) => {
        const z = cz + ((i % 2) - 0.5) * 2.8;
        if (i < 4) {
          // a rail under each edge of a row
          const front = i < 2;
          o3.position.set(cx, top + (front ? 0.025 : back - 0.02), z + (front ? 1 : -1) * (half * Math.cos(tilt) - 0.04));
          o3.scale.set(4.84, front ? 0.05 : 0.04, 0.04);
        } else {
          o3.position.set(cx + (Math.floor((i - 4) / 2) - 2) * 1.21, top + back / 2 - 0.02, z - half * Math.cos(tilt) + 0.04);
          o3.scale.set(0.04, back - 0.04, 0.04);
        }
      }, false);
      g.visible = false;
      root.add(g);
      return g;
    };
    /** x0…z1: the outer face of the volume's walls; yb their top; ye where the roof springs from */
    const pitched = (kind: 'mono' | 'gable', v: { x0: number; x1: number; z0: number; z1: number; yb: number; ye: number; wall: THREE.Material }): Pitched => {
      const g = new THREE.Group();
      const k = PITCH[kind];
      const gable = kind === 'gable';
      const zr = gable ? (v.z0 + v.z1) / 2 : v.z0;
      const yr = v.ye + (v.z1 - zr) * k;
      const wall = new THREE.Mesh(
        prism(gable ? [[v.z0, v.yb], [v.z1, v.yb], [v.z1, v.ye], [zr, yr], [v.z0, v.ye]] : [[v.z0, v.yb], [v.z1, v.yb], [v.z1, v.ye], [v.z0, yr]], v.x0, v.x1),
        v.wall,
      );
      wall.castShadow = wall.receiveShadow = true;
      g.add(wall);
      const side = 0.35;
      const eave = 0.45;
      const front = slope(g, v.x0 - side, v.x1 + side, [v.z1 + eave, v.ye - eave * k], gable ? [zr, yr] : [v.z0 - 0.3, yr + 0.3 * k], gable);
      if (gable) {
        slope(g, v.x0 - side, v.x1 + side, [v.z0 - eave, v.ye - eave * k], [zr, yr], true);
        const apex = yr + RT * Math.hypot(1, k);
        solid(g, [{ p: [(v.x0 + v.x1) / 2, apex + SEAM - 0.02, zr], s: [v.x1 - v.x0 + 2 * side + 0.04, 0.06, 0.3], m: M.coping }]);
      }
      g.visible = false;
      root.add(g);
      // lying down on a gable's shorter slope, upright on the long single one
      return { g, panels: gable ? panelsOn(front, 4, 2, 1.8, 1.15) : panelsOn(front, 4, 2, 1.15, 1.8) };
    };
    const O = 0.25; // structure line to the face of the wall
    const ground = { x0: G.x0 - O, x1: G.x1 + O, z0: G.z0 - O, z1: G.z1 + O, yb: G.h, ye: G.h + 0.36, wall: M.skin };
    const upper = { x0: U.x0 - O, x1: U.x1 + O, z0: U.z0 - O, z1: U.z1 + O, yb: U.y + U.h, ye: U.y + U.h + 0.36, wall: M.skinU };
    roofs.push(
      { vol: 'G', mono: pitched('mono', ground), gable: pitched('gable', ground), flatSolar: panelsFlat(-1.4, 0.3, 3.48) },
      { vol: 'U', mono: pitched('mono', upper), gable: pitched('gable', upper), flatSolar: panelsFlat(-2.15, -0.9, 6.58) },
    );
  }
  scene.add(catcher);

  /* —— state: every value eases towards its target; the scene renders only while one is moving —— */
  const cfg: HouseConfig = { ...DEFAULT_CONFIG };
  const st = { t: 0, tT: 0, turn: 0, turnT: 0, focus: null as LayerId | null, dim: new Map<string, number>(), sys: 0, sysT: 0, floors: 1, floorsT: 1, width: 1, widthT: 1, wood: 0, woodT: 0, wide: 0, wideT: 0 };
  let active = false;
  let raf = 0;
  let last = 0;
  let dirty = true;
  // 0 full · 1 lower resolution · 2 lower still, no sun shadows (the contact shadow stays)
  let quality = 0;
  let slowFrames = 0;
  const fixed = /[?&]house3d=hq/.test(location.search); // for screenshots on machines without a GPU
  let shadowKey = '';
  const ink = new THREE.Color(0x394141);
  const stone = new THREE.Color(0xf1e7d6);
  const wood = new THREE.Color(0xb98a58);

  const roofKind = () => (!layers && (cfg.roof === 'mono' || cfg.roof === 'gable') ? cfg.roof : 'flat');
  const apply = () => {
    const t = st.t;
    const sloped = roofKind() !== 'flat';
    // which way each layer leaves, and when: outermost first
    const f = ss(0.04, 0.3, t);
    const r = ss(0.14, 0.42, t);
    const ins = ss(0.3, 0.56, t);
    const env2 = ss(0.42, 0.68, t);
    const lift = ss(0.2, 0.72, t) * 2.9 * st.floors;
    const fnd = ss(0.72, 0.97, t);
    const out: Record<LayerId, number> = { finishes: f * 3.6, insulation: ins * 2.4, envelope: env2 * 1.25, structure: 0, services: 0, roof: 0, foundation: 0 };
    for (const p of parts) {
      let y = p.vol === 'U' ? lift : 0;
      if (p.layer === 'roof') y += r * (p.vol === 'U' ? 2.9 : p.only === 1 ? 2.9 : 1.1);
      if (p.layer === 'foundation') y -= fnd * 1.8;
      const k = out[p.layer];
      let vis = 1;
      if (p.vol === 'U' || p.only === 2) vis *= st.floors;
      if (p.only === 1) vis *= 1 - st.floors;
      // the structure of the chosen system is raised from the floor up; the other one is let go
      let grow = 1;
      if (p.system) {
        const mine = p.system === 'timber' ? st.sys : 1 - st.sys;
        grow = ss(0.25, 1, mine);
        vis *= mine;
      }
      p.mesh.visible = vis > 0.015 && !(sloped && p.flat);
      p.mesh.scale.y = Math.max(grow, 0.001);
      p.mesh.position.set(p.n[0] * k, y + p.y0 * (1 - grow), p.n[1] * k);
    }
    const drop = fnd * 1.8;
    contact.position.y = (layers ? 0.012 : 0.05) - drop - (layers ? 1.05 : 0);
    catcher.position.y = (layers ? 0.01 : 0.045) - drop - (layers ? 1.05 : 0);
    (contact.material as THREE.MeshBasicMaterial).opacity = (layers ? 0.75 : 0.55) * (1 - 0.45 * ss(0.05, 0.6, t));

    for (const [key, x] of mats) {
      const d = st.dim.get(key) ?? 0;
      const target = st.focus && st.focus !== x.layer ? 1 : 0;
      const next = d + (target - d) * 0.14;
      const g = Math.abs(next - target) < 0.004 ? target : next;
      st.dim.set(key, g);
      if (key === 'skinU') x.base.copy(stone).lerp(wood, st.wood);
      // the layers that are not the subject step back to a ghost of themselves
      const sysA = x.system ? ss(0, 0.75, x.system === 'timber' ? st.sys : 1 - st.sys) : 1;
      const alpha = x.alpha * (1 - g * 0.9) * sysA;
      const see = alpha < 0.995;
      if (x.m.transparent !== see) {
        x.m.transparent = see;
        x.m.needsUpdate = true;
      }
      x.m.color.copy(base(x.base, g));
      x.m.opacity = alpha;
      x.m.depthWrite = alpha > 0.5;
    }
    M.skinU.map = st.wood > 0.5 ? tex.grain : tex.stone;

    root.scale.x = st.width;
    // camera: a slow walk round the model, drawing back as it opens
    const narrow = camera.aspect < 1 ? 1.5 : 1;
    const a = THREE.MathUtils.degToRad(layers ? 38 + 30 * t : 34) + st.turn;
    const el = THREE.MathUtils.degToRad(layers ? 13 + 6 * t : 17 - 2 * st.wide);
    const dist = (layers ? 56 + 27 * t : 62 + 6 * st.wide) * narrow;
    const cy = layers ? 2.9 + 2.3 * t : 2 + st.floors * 0.6;
    const cx = layers ? -0.4 : -0.6;
    const cz = layers ? 0 : 1.6;
    camera.position.set(cx + Math.sin(a) * Math.cos(el) * dist, cy + Math.sin(el) * dist, cz + Math.cos(a) * Math.cos(el) * dist);
    camera.lookAt(cx, cy, cz);
  };
  const tmp = new THREE.Color();
  const base = (c: THREE.Color, g: number) => tmp.copy(c).lerp(ink, g * 0.4);

  const settle = (dt: number) => {
    const k = 1 - Math.exp(-dt * 7.5);
    let moving = false;
    const ease = (v: 't' | 'turn' | 'sys' | 'floors' | 'width' | 'wood' | 'wide', tv: 'tT' | 'turnT' | 'sysT' | 'floorsT' | 'widthT' | 'woodT' | 'wideT', eps: number, rate = 1) => {
      const d = st[tv] - st[v];
      if (d === 0) return;
      if (Math.abs(d) < eps) st[v] = st[tv];
      else {
        st[v] += d * Math.min(1, k * rate);
        moving = true;
      }
    };
    ease('t', 'tT', 0.0005, 1.3);
    ease('turn', 'turnT', 0.0005, 1.2);
    ease('sys', 'sysT', 0.003, 0.55);
    ease('floors', 'floorsT', 0.003, 0.8);
    ease('width', 'widthT', 0.002);
    ease('wood', 'woodT', 0.004, 0.8);
    ease('wide', 'wideT', 0.003, 0.6);
    for (const [key, x] of mats) {
      const target = st.focus && st.focus !== x.layer ? 1 : 0;
      if ((st.dim.get(key) ?? 0) !== target) moving = true;
    }
    return moving;
  };

  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
    last = now;
    const moving = settle(dt);
    if ((moving || dirty) && compiled) {
      dirty = false;
      apply();
      // the shadow map only needs redrawing when something other than the camera has moved
      const key = `${st.t.toFixed(4)}|${st.sys.toFixed(3)}|${st.floors.toFixed(3)}|${st.width.toFixed(3)}|${cfg.pool}${cfg.porch}${cfg.garage}${cfg.solar}${cfg.volume}${cfg.roof}${cfg.floors}`;
      if (key !== shadowKey) {
        shadowKey = key;
        renderer.shadowMap.needsUpdate = true;
      }
      renderer.render(scene, camera);
      // too slow for this machine? give up pixels, then shadows, before giving up smoothness
      if (moving && !fixed && quality < 2) {
        slowFrames = dt > 0.03 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
        if (slowFrames > 10) {
          slowFrames = 0;
          quality++;
          if (quality === 2) {
            sun.castShadow = false;
            catcher.visible = false;
            (contact.material as THREE.MeshBasicMaterial).opacity *= 1.25;
          }
          resize();
        }
      }
    }
    if (active && (moving || dirty)) raf = requestAnimationFrame(frame);
  };
  const wake = () => {
    dirty = true;
    if (active && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };

  // shaders are compiled off the main thread where the browser can; nothing is drawn until they are
  let compiled = false;
  const ready = () => {
    compiled = true;
    wake();
  };

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 0 ? (small ? 1.75 : 2) : quality === 1 ? 1.25 : 1));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    wake();
  };
  resize();
  apply();
  await breathe();
  renderer.compileAsync(scene, camera).then(ready, ready);

  return {
    setProgress(t) {
      st.tT = Math.min(1, Math.max(0, t));
      wake();
    },
    setFocus(layer) {
      st.focus = layer;
      wake();
    },
    setConfig(c) {
      Object.assign(cfg, c);
      st.sysT = cfg.system === 'timber' ? 1 : 0;
      st.floorsT = cfg.floors === 2 ? 1 : 0;
      st.widthT = cfg.width;
      st.woodT = cfg.finish === 'wood' ? 1 : 0;
      extras.pool.visible = cfg.pool;
      extras.porch.visible = cfg.porch;
      extras.garage.visible = cfg.garage;
      extras.wing.visible = cfg.volume === 'L';
      // the roof and its panels belong to the topmost volume
      const kind = roofKind();
      for (const r of roofs) {
        const top = r.vol === (cfg.floors === 2 ? 'U' : 'G');
        r.mono.g.visible = top && kind === 'mono';
        r.gable.g.visible = top && kind === 'gable';
        r.mono.panels.visible = r.gable.panels.visible = cfg.solar;
        r.flatSolar.visible = cfg.solar && top && kind === 'flat';
      }
      st.wideT = cfg.pool || cfg.garage || cfg.porch || cfg.volume === 'L' ? 1 : 0;
      wake();
    },
    setTurn(a) {
      st.turnT = a;
      wake();
    },
    snapshot() {
      if (!compiled) return null;
      // draw and read in the same task: the drawing buffer is only guaranteed until the browser composites
      apply();
      renderer.shadowMap.needsUpdate = true;
      renderer.render(scene, camera);
      const flat = document.createElement('canvas');
      flat.width = canvas.width;
      flat.height = canvas.height;
      const c2 = flat.getContext('2d')!;
      c2.fillStyle = '#0d1520';
      c2.fillRect(0, 0, flat.width, flat.height);
      c2.drawImage(canvas, 0, 0);
      return flat.toDataURL('image/jpeg', 0.86);
    },
    resize,
    setActive(on) {
      active = on;
      if (on) wake();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    dispose() {
      active = false;
      cancelAnimationFrame(raf);
      for (const d of disposables) d.dispose();
      renderer.dispose();
    },
  };
}
