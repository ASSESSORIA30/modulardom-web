import type { StationId } from './i18n';
import manifest from './tour.json';

/*
  The tour: one continuous camera move, exterior → door → living room → kitchen.
  Frames, focus track and motion map come from `npm run tour` (scripts/build-tour.mjs).
  To extend it, add clips to media/tour.json, rebuild, and add stations below.
*/

type Manifest = {
  count: number;
  fps: number;
  tiers: Record<Tier, { w: number; h: number }>;
  /** [frame, x]: where the subject is, for screens that crop the 16:9 picture */
  focus: [number, number][];
  /** map[i]: frame i's place on a 0 → 1 line of even camera travel */
  map: number[];
};
export type Tier = 'md' | 'sm' | 'hd';
export const TOUR = manifest as unknown as Manifest;

/** bump when frames are rebuilt: they are cached for a year */
export const TOUR_VERSION = 2;
export const tourUrl = (tier: Tier, frame: number) =>
  `/tour/${tier}/${String(frame + 1).padStart(4, '0')}.avif?v=${TOUR_VERSION}`;

/** frame shown at tour progress p (0 → 1) */
export function frameAt(p: number): number {
  const { map } = TOUR;
  let lo = 0;
  let hi = map.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (map[mid] < p) lo = mid + 1;
    else hi = mid;
  }
  return lo > 0 && p - map[lo - 1] < map[lo] - p ? lo - 1 : lo;
}
export const progressOf = (frame: number) => TOUR.map[Math.min(Math.max(frame, 0), TOUR.count - 1)];

export function focusAt(frame: number): number {
  const k = TOUR.focus;
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

export type Station = {
  id: StationId;
  /** frames between which its words are on screen */
  from: number;
  to: number;
  place: 'bottom-left' | 'middle-right' | 'top-left' | 'bottom-right';
  /** still used when the tour is shown without motion */
  still: string;
  actions?: boolean;
  values?: boolean;
};

export const STATIONS: Station[] = [
  { id: 'exterior', from: 0, to: 112, place: 'bottom-left', still: 'tour-exterior', actions: true },
  { id: 'entrada', from: 150, to: 264, place: 'middle-right', still: 'tour-entrada', values: true },
  { id: 'interior', from: 296, to: 424, place: 'top-left', still: 'tour-interior' },
  { id: 'cuina', from: 470, to: 549, place: 'bottom-right', still: 'tour-cuina' },
];
