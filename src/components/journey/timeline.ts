/*
  The tour's clock. Every scene lasts 1 unit; neighbours share OVERLAP of it, and in that shared
  stretch both clips keep moving while one dissolves into the other.
*/
export const OVERLAP = 0.16;
const STEP = 1 - OVERLAP;

export const totalUnits = (n: number) => n - (n - 1) * OVERLAP;
export const sceneStart = (i: number) => i * STEP;
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** a scene's own progress, 0 → 1, at tour time t */
export const sceneProgress = (i: number, t: number) => clamp01(t - sceneStart(i));

export type Sample = {
  /** scene on top */
  scene: number;
  p: number;
  /** the scene it is dissolving out of, if any */
  under: number | null;
  underP: number;
  /** 0 → 1 through the dissolve; 1 outside it */
  mix: number;
};

export function sample(t: number, n: number): Sample {
  const scene = Math.min(n - 1, Math.max(0, Math.floor(t / STEP)));
  const p = clamp01(t - scene * STEP);
  if (scene > 0 && p < OVERLAP) {
    return { scene, p, under: scene - 1, underP: clamp01(p + STEP), mix: p / OVERLAP };
  }
  return { scene, p, under: null, underP: 0, mix: 1 };
}

/** the scene the interface names at t (switches at the middle of a dissolve) */
export const currentScene = (s: Sample) => (s.under !== null && s.mix < 0.5 ? s.under : s.scene);

export const smooth = (x: number) => x * x * (3 - 2 * x);
