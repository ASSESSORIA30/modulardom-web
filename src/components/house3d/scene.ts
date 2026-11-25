import * as THREE from 'three';
import type { LayerId, SystemId } from '@/content/i18n';

/*
  A conceptual house, built in code and taken apart layer by layer.

  Everything is instanced boxes: blocks, studs, boards, panes. No model file, no textures.
  Dimensions are compositional (they make the drawing read), never technical: nothing here states
  a real thickness, build-up or performance.

  The scene renders on demand: only while something is still moving towards its target.
  Used twice: the "layers" section (scroll takes it apart) and the configurator (assembled,
  reacting to the choices).
*/

export const LAYERS: LayerId[] = ['finishes', 'roof', 'insulation', 'envelope', 'services', 'structure', 'foundation'];

export type HouseConfig = {
  floors: 1 | 2;
  /** footprint stretch along the long side, 0.8 … 1.35 */
  width: number;
  system: SystemId;
  finish: 'mineral' | 'wood';
  pool: boolean;
  porch: boolean;
  garage: boolean;
  solar: boolean;
};

export const DEFAULT_CONFIG: HouseConfig = { floors: 2, width: 1, system: 'cellular', finish: 'mineral', pool: false, porch: false, garage: false, solar: false };

type Box = { p: [number, number, number]; s: [number, number, number] };
type Opening = { a: number; b: number; y0: number; y1: number; door?: boolean };
type Wall = { vol: 'G' | 'U'; s: [number, number]; d: [number, number]; n: [number, number]; len: number; y: number; h: number; open: Opening[] };

const COLORS = {
  foundation: 0x9c9b95,
  block: 0xf2f0ea,
  timber: 0xd09a55,
  slab: 0xd9d5cb,
  envelope: 0xb9b2a4,
  insulation: 0xe2c96f,
  copper: 0xc47a3e,
  water: 0x3f9e97,
  duct: 0xb9bdc0,
  roof: 0x5d6466,
  skin: 0xefe6d6,
  skinWood: 0xa9794d,
  glass: 0xa9cdd3,
  frame: 0x1b2021,
  oak: 0x9a6a42,
  dim: 0x394141,
  pool: 0x4aa7a0,
};

const ss = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

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
    [{ a: 0.8, b: 7.2, y0: 0.12, y1: 2.7 }, { a: 8.4, b: 10.2, y0: 0, y1: 2.6, door: true }],
    [{ a: 2.2, b: 5.8, y0: 0.9, y1: 2.5 }],
    [{ a: 1.5, b: 4, y0: 0.9, y1: 2.5 }, { a: 7, b: 10.5, y0: 0.9, y1: 2.5 }],
    [{ a: 1, b: 7, y0: 0.12, y1: 2.7 }],
  ]),
  ...wallsOf(U, 'U', [
    [{ a: 0.8, b: 7.2, y0: 0.12, y1: 2.5 }],
    [{ a: 1.5, b: 4.5, y0: 0.9, y1: 2.3 }],
    [{ a: 1.2, b: 3.4, y0: 0.9, y1: 2.3 }, { a: 4.8, b: 7, y0: 0.9, y1: 2.3 }],
    [{ a: 0.9, b: 5.1, y0: 0.12, y1: 2.5 }],
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

/** a continuous layer outside the structure: one board per solid, corners closed */
function skin(w: Wall, off: number, th: number): Box[] {
  return solids(w).map(([u0, u1, v0, v1]) => onWall(w, u0 <= 0 ? -(off + th) : u0, u1 >= w.len ? w.len + off + th : u1, v0, v1, off, th));
}

const T = 0.3; // structural wall, compositional
function blocks(w: Wall): Box[] {
  const out: Box[] = [];
  const bl = 0.62;
  const bh = 0.25;
  const gap = 0.014;
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
  const sw = 0.07;
  const d = 0.2;
  const off = -d - 0.02;
  for (const [u0, u1, v0, v1] of solids(w)) {
    out.push(onWall(w, u0, u1, v0, v0 + sw, off, d), onWall(w, u0, u1, v1 - sw, v1, off, d));
    const n = Math.max(1, Math.round((u1 - u0) / 0.6));
    for (let i = 0; i <= n; i++) {
      const u = u0 + ((u1 - u0 - sw) * i) / n;
      out.push(onWall(w, u, u + sw, v0 + sw, v1 - sw, off, d));
    }
  }
  return out;
}

function glazing(w: Wall): { glass: Box[]; frames: Box[]; doors: Box[] } {
  const glass: Box[] = [];
  const frames: Box[] = [];
  const doors: Box[] = [];
  const f = 0.07;
  for (const o of w.open) {
    if (o.door) doors.push(onWall(w, o.a + f, o.b - f, o.y0, o.y1 - f, 0.04, 0.08));
    else {
      glass.push(onWall(w, o.a, o.b, o.y0, o.y1, 0.08, 0.03));
      // mullions: tall panes, as in the house of the tour
      const n = Math.max(1, Math.round((o.b - o.a) / 1.7));
      for (let i = 1; i < n; i++) {
        const u = o.a + ((o.b - o.a) * i) / n;
        frames.push(onWall(w, u - f / 2, u + f / 2, o.y0, o.y1, 0.05, 0.1));
      }
    }
    frames.push(
      onWall(w, o.a, o.a + f, o.y0, o.y1, 0.05, 0.1),
      onWall(w, o.b - f, o.b, o.y0, o.y1, 0.05, 0.1),
      onWall(w, o.a, o.b, o.y1 - f, o.y1, 0.05, 0.1),
    );
    if (o.y0 > 0.05) frames.push(onWall(w, o.a, o.b, o.y0, o.y0 + f, 0.05, 0.1));
  }
  return { glass, frames, doors };
}

/* —— scene —— */

type Part = { mesh: THREE.Object3D; layer: LayerId; vol: 'G' | 'U' | 'base'; n: [number, number]; system?: SystemId; only?: 1 | 2 };

export type HouseScene = {
  /** 0 assembled → 1 fully apart */
  setProgress(t: number): void;
  setFocus(layer: LayerId | null): void;
  setConfig(c: Partial<HouseConfig>): void;
  /** radians added to the camera's turn (drag, pointer) */
  setTurn(a: number): void;
  setAutoRotate(on: boolean): void;
  resize(): void;
  setActive(on: boolean): void;
  dispose(): void;
};

export function createHouseScene(canvas: HTMLCanvasElement, opts: { mode: 'layers' | 'config'; onFrame?: () => void }): HouseScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 1, 200);
  const root = new THREE.Group();
  scene.add(root);

  scene.add(new THREE.HemisphereLight(0xfff3e0, 0x1b2224, 1.05));
  const sun = new THREE.DirectionalLight(0xffe2bd, 2.6);
  sun.position.set(14, 22, 16);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 80 });
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xa8d8e0, 0.55);
  fill.position.set(-16, 9, -12);
  scene.add(fill);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.ShadowMaterial({ opacity: 0.38 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const unit = new THREE.BoxGeometry(1, 1, 1);
  const mats = new Map<string, { m: THREE.MeshStandardMaterial; base: THREE.Color; layer: LayerId }>();
  const mat = (key: string, layer: LayerId, color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, ...extra });
    mats.set(key, { m, base: new THREE.Color(color), layer });
    return m;
  };
  const M = {
    foundation: mat('foundation', 'foundation', COLORS.foundation, { roughness: 0.95 }),
    block: mat('block', 'structure', COLORS.block, { roughness: 0.9 }),
    timber: mat('timber', 'structure', COLORS.timber, { roughness: 0.7 }),
    slab: mat('slab', 'structure', COLORS.slab, { roughness: 0.9 }),
    envelope: mat('envelope', 'envelope', COLORS.envelope),
    insulation: mat('insulation', 'insulation', COLORS.insulation, { roughness: 1 }),
    copper: mat('copper', 'services', COLORS.copper, { roughness: 0.4, metalness: 0.6 }),
    water: mat('water', 'services', COLORS.water, { roughness: 0.5 }),
    duct: mat('duct', 'services', COLORS.duct, { roughness: 0.45, metalness: 0.5 }),
    roof: mat('roof', 'roof', COLORS.roof, { roughness: 0.9 }),
    skin: mat('skin', 'finishes', COLORS.skin, { roughness: 0.75 }),
    glass: mat('glass', 'finishes', COLORS.glass, { roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.3 }),
    frame: mat('frame', 'finishes', COLORS.frame, { roughness: 0.5, metalness: 0.3 }),
    oak: mat('oak', 'finishes', COLORS.oak, { roughness: 0.6 }),
  };

  const parts: Part[] = [];
  const dummy = new THREE.Object3D();
  const add = (boxes: Box[], material: THREE.Material, p: Omit<Part, 'mesh'>, shadow = true) => {
    if (!boxes.length) return;
    const mesh = new THREE.InstancedMesh(unit, material, boxes.length);
    boxes.forEach((b, i) => {
      dummy.position.set(...b.p);
      dummy.scale.set(...b.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    root.add(mesh);
    parts.push({ mesh, ...p });
  };

  // walls, layer by layer
  for (const w of WALLS) {
    const base = { vol: w.vol, n: w.n } as const;
    add(blocks(w), M.block, { ...base, layer: 'structure', system: 'cellular' });
    add(studs(w), M.timber, { ...base, layer: 'structure', system: 'timber' });
    add(skin(w, 0, 0.05), M.envelope, { ...base, layer: 'envelope' });
    add(skin(w, 0.05, 0.14), M.insulation, { ...base, layer: 'insulation' });
    add(skin(w, 0.19, 0.06), M.skin, { ...base, layer: 'finishes' });
    const g = glazing(w);
    add(g.glass, M.glass, { ...base, layer: 'finishes' }, false);
    add(g.frames, M.frame, { ...base, layer: 'finishes' });
    add(g.doors, M.oak, { ...base, layer: 'finishes' });
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

  // floors: solid slabs in aerated concrete, joists in timber
  const joists = (x0: number, x1: number, z0: number, z1: number, y: number): Box[] => {
    const out: Box[] = [];
    for (let x = x0 + 0.04; x <= x1; x += 0.6) out.push({ p: [x, y, (z0 + z1) / 2], s: [0.08, 0.26, z1 - z0] });
    out.push({ p: [(x0 + x1) / 2, y, z0 + 0.04], s: [x1 - x0, 0.26, 0.08] }, { p: [(x0 + x1) / 2, y, z1 - 0.04], s: [x1 - x0, 0.26, 0.08] });
    return out;
  };
  add([{ p: [0, 3.15, 0], s: [12, 0.3, 8] }], M.slab, { layer: 'structure', vol: 'G', n: none, system: 'cellular' });
  add(joists(-6, 6, -4, 4, 3.15), M.timber, { layer: 'structure', vol: 'G', n: none, system: 'timber' });
  add([{ p: [-2, 6.25, -1], s: [8, 0.3, 6] }], M.slab, { layer: 'structure', vol: 'U', n: none, system: 'cellular' });
  add(joists(-6, 2, -4, 2, 6.25), M.timber, { layer: 'structure', vol: 'U', n: none, system: 'timber' });

  // roofs: the upper one oversails; with one floor the ground volume gets its own
  add(
    [
      { p: [-2, 6.52, -0.6], s: [9.4, 0.22, 7.6] },
      { p: [-2, 6.72, -4.3], s: [9.4, 0.2, 0.18] },
      { p: [-6.6, 6.72, -0.6], s: [0.18, 0.2, 7.6] },
    ],
    M.roof,
    { layer: 'roof', vol: 'U', n: none, only: 2 },
  );
  add(
    [
      { p: [4, 3.36, 0], s: [4, 0.1, 8] },
      { p: [-2, 3.36, 3], s: [8, 0.1, 2] },
      { p: [6.06, 3.62, 0], s: [0.12, 0.5, 8.24] },
      { p: [0, 3.62, 4.06], s: [12.24, 0.5, 0.12] },
    ],
    M.roof,
    { layer: 'roof', vol: 'G', n: none, only: 2 },
  );
  add(
    [
      { p: [0, 3.42, 0.5], s: [13.4, 0.22, 9.6] },
      { p: [0, 3.62, -4.3], s: [13.4, 0.2, 0.18] },
    ],
    M.roof,
    { layer: 'roof', vol: 'G', n: none, only: 1 },
  );

  // services: heating loops in the floor, risers, a duct, conduits round the rooms
  const loops = (x0: number, x1: number, z0: number, z1: number, y: number): Box[] => {
    const out: Box[] = [];
    let flip = false;
    for (let x = x0; x <= x1; x += 0.45, flip = !flip) {
      out.push({ p: [x, y, (z0 + z1) / 2], s: [0.05, 0.05, z1 - z0] });
      if (x + 0.45 <= x1) out.push({ p: [x + 0.225, y, flip ? z0 : z1], s: [0.5, 0.05, 0.05] });
    }
    return out;
  };
  add(loops(-5.3, 5.3, -3.3, 3.3, 0.05), M.copper, { layer: 'services', vol: 'G', n: none }, false);
  add(loops(-5.3, 1.3, -3.3, 1.3, 3.36), M.copper, { layer: 'services', vol: 'U', n: none }, false);
  add(
    [
      { p: [1.4, 1.5, -3.4], s: [0.09, 3, 0.09] },
      { p: [1.65, 1.5, -3.4], s: [0.09, 3, 0.09] },
      { p: [-1.6, 0.35, -3.4], s: [6, 0.09, 0.09] },
      { p: [-4.6, 0.7, -3.4], s: [0.09, 0.8, 0.09] },
    ],
    M.water,
    { layer: 'services', vol: 'G', n: none },
    false,
  );
  add(
    [
      { p: [0, 2.72, -1.2], s: [10.4, 0.24, 0.42] },
      { p: [3.2, 2.72, 1], s: [0.42, 0.24, 4.4] },
      { p: [-3.4, 2.72, 1], s: [0.42, 0.24, 4.4] },
    ],
    M.duct,
    { layer: 'services', vol: 'G', n: none },
  );
  add(
    [
      { p: [-2, 5.88, -1], s: [6.6, 0.2, 0.36] },
      { p: [1.52, 4.7, -3.4], s: [0.09, 2.8, 0.09] },
    ],
    M.duct,
    { layer: 'services', vol: 'U', n: none },
  );

  /* —— configurator extras —— */
  const extra = (boxes: (Box & { m: THREE.Material })[], shadow = true) => {
    const g = new THREE.Group();
    for (const b of boxes) {
      const mesh = new THREE.Mesh(unit, b.m);
      mesh.position.set(...b.p);
      mesh.scale.set(...b.s);
      mesh.castShadow = shadow;
      mesh.receiveShadow = true;
      g.add(mesh);
    }
    g.visible = false;
    scene.add(g);
    return g;
  };
  const poolMat = new THREE.MeshStandardMaterial({ color: COLORS.pool, roughness: 0.15, metalness: 0.1 });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x1d2a36, roughness: 0.3, metalness: 0.5 });
  const extras = {
    pool: extra(
      [
        { p: [-1.5, 0.04, 8.6], s: [9.4, 0.08, 4.4], m: M.skin },
        { p: [-1.5, 0.09, 8.6], s: [8.4, 0.03, 3.4], m: poolMat },
      ],
      false,
    ),
    porch: extra([
      { p: [8.3, 2.9, 1], s: [4.4, 0.14, 5.6], m: M.oak },
      { p: [10.3, 1.45, 3.6], s: [0.16, 2.9, 0.16], m: M.frame },
      { p: [10.3, 1.45, -1.6], s: [0.16, 2.9, 0.16], m: M.frame },
      { p: [8.3, 0.04, 1], s: [4.6, 0.08, 5.8], m: M.skin },
    ]),
    garage: extra([
      { p: [-9, 1.35, -1.2], s: [5.6, 2.7, 5.6], m: M.skin },
      { p: [-9, 2.8, -1.2], s: [6, 0.2, 6], m: M.roof },
      { p: [-9, 1.15, 1.63], s: [4.2, 2.3, 0.06], m: M.oak },
    ]),
    solar: extra(
      Array.from({ length: 8 }, (_, i) => ({
        p: [-4.4 + (i % 4) * 1.5, 6.74, -2.4 + Math.floor(i / 4) * 2.2] as [number, number, number],
        s: [1.3, 0.06, 1.9] as [number, number, number],
        m: panelMat,
      })),
    ),
  };

  /* —— state: every value eases towards its target; the scene renders only while one is moving —— */
  const cfg: HouseConfig = { ...DEFAULT_CONFIG };
  const st = { t: 0, tT: 0, turn: 0, turnT: 0, focus: null as LayerId | null, dim: new Map<string, number>(), sys: 0, sysT: 0, floors: 1, floorsT: 1, width: 1, widthT: 1, wood: 0, woodT: 0 };
  let auto = false;
  let autoAngle = 0;
  let active = false;
  let raf = 0;
  let last = 0;
  let dirty = true;
  const ink = new THREE.Color(COLORS.dim);
  const skinA = new THREE.Color(COLORS.skin);
  const skinB = new THREE.Color(COLORS.skinWood);

  const apply = () => {
    const t = st.t;
    // which way each layer leaves, and when
    const f = ss(0.04, 0.3, t);
    const r = ss(0.14, 0.42, t);
    const ins = ss(0.3, 0.56, t);
    const env = ss(0.42, 0.68, t);
    const lift = ss(0.2, 0.72, t) * 2.7 * st.floors;
    const fnd = ss(0.72, 0.97, t);
    const out: Record<LayerId, number> = { finishes: f * 3.3, insulation: ins * 2.2, envelope: env * 1.15, structure: 0, services: 0, roof: 0, foundation: 0 };
    for (const p of parts) {
      const up = p.vol === 'U' ? lift : 0;
      let y = up;
      if (p.layer === 'roof') y += r * (p.vol === 'U' ? 2.6 : p.only === 1 ? 2.6 : 1);
      if (p.layer === 'foundation') y -= fnd * 1.7;
      const k = out[p.layer];
      p.mesh.position.set(p.n[0] * k, y, p.n[1] * k);
      // system and number of floors: parts scale in and out rather than pop
      let vis = 1;
      if (p.system) vis *= p.system === 'cellular' ? 1 - st.sys : st.sys;
      if (p.vol === 'U') vis *= st.floors;
      if (p.only === 2) vis *= st.floors;
      if (p.only === 1) vis *= 1 - st.floors;
      p.mesh.visible = vis > 0.02;
      if (p.system) p.mesh.scale.setScalar(0.94 + 0.06 * vis);
    }
    ground.position.y = -1.06 - fnd * 1.7;
    for (const [key, { m, base, layer }] of mats) {
      const d = st.dim.get(key) ?? 0;
      const target = st.focus && st.focus !== layer ? 1 : 0;
      const next = d + (target - d) * 0.16;
      st.dim.set(key, Math.abs(next - target) < 0.004 ? target : next);
      if (key === 'skin') base.copy(skinA).lerp(skinB, st.wood);
      // the layers that are not the subject step back to a ghost of themselves
      const g = st.dim.get(key) ?? 0;
      m.color.copy(base).lerp(ink, g * 0.35);
      const see = key === 'glass' || g > 0.01;
      if (m.transparent !== see) {
        m.transparent = see;
        m.needsUpdate = true;
      }
      m.opacity = (key === 'glass' ? 0.3 : 1) * (1 - g * 0.88);
      m.depthWrite = g < 0.5 && key !== 'glass';
    }
    root.scale.x = st.width;
    // camera: a slow walk round the house as it comes apart
    const a = THREE.MathUtils.degToRad(opts.mode === 'layers' ? 36 + 34 * t : 32) + st.turn + autoAngle;
    const el = THREE.MathUtils.degToRad(opts.mode === 'layers' ? 15 + 5 * t : 14);
    const narrow = camera.aspect < 1 ? 1.55 : 1;
    const dist = (opts.mode === 'layers' ? 42 + 19 * t : 36 + (cfg.pool || cfg.garage || cfg.porch ? 11 : 0)) * narrow;
    const cy = opts.mode === 'layers' ? 2.8 + 2.2 * t : 2.2 + st.floors * 0.7;
    camera.position.set(Math.sin(a) * Math.cos(el) * dist, cy + Math.sin(el) * dist, Math.cos(a) * Math.cos(el) * dist);
    camera.lookAt(-0.4, cy, 0);
  };

  const settle = (dt: number) => {
    const k = 1 - Math.exp(-dt * 9);
    let moving = false;
    const ease = (v: 't' | 'turn' | 'sys' | 'floors' | 'width' | 'wood', tv: 'tT' | 'turnT' | 'sysT' | 'floorsT' | 'widthT' | 'woodT', eps: number) => {
      const d = st[tv] - st[v];
      if (d === 0) return;
      if (Math.abs(d) < eps) st[v] = st[tv];
      else {
        st[v] += d * k;
        moving = true;
      }
    };
    ease('t', 'tT', 0.0005);
    ease('turn', 'turnT', 0.0005);
    ease('sys', 'sysT', 0.004);
    ease('floors', 'floorsT', 0.004);
    ease('width', 'widthT', 0.002);
    ease('wood', 'woodT', 0.004);
    for (const [key, { layer }] of mats) {
      const target = st.focus && st.focus !== layer ? 1 : 0;
      if ((st.dim.get(key) ?? 0) !== target) moving = true;
    }
    if (auto) {
      autoAngle += dt * 0.1;
      moving = true;
    }
    return moving;
  };

  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
    last = now;
    const moving = settle(dt);
    if (moving || dirty) {
      dirty = false;
      apply();
      renderer.render(scene, camera);
      opts.onFrame?.();
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

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    wake();
  };
  resize();

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
      extras.solar.visible = cfg.solar && cfg.floors === 2;
      wake();
    },
    setTurn(a) {
      st.turnT = a;
      wake();
    },
    setAutoRotate(on) {
      auto = on;
      wake();
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
      unit.dispose();
      for (const { m } of mats.values()) m.dispose();
      poolMat.dispose();
      panelMat.dispose();
      (ground.material as THREE.Material).dispose();
      ground.geometry.dispose();
      renderer.dispose();
    },
  };
}
