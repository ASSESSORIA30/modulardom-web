import frames from './frames.json';

/*
  The tour, in order. To add a room (suite, bany, despatx, terrassa, exterior nocturn):
    1. drop the clip in media/originals and add it to media/scenes.json
    2. npm run frames            (writes public/frames/<id> and frames.json)
    3. add an entry here and its copy under `scenes` in i18n.ts (both languages)
    4. bump FRAMES_VERSION if an existing scene's frames changed
  The scroll length, the progress rail and the dissolves follow this list.
*/

export const FRAMES_VERSION = 1;

export type SceneAction = 'configure' | 'projects';
export type SceneDef = {
  id: keyof typeof frames;
  /** where the copy sits on the frame */
  place: 'bottom-left' | 'middle-left' | 'bottom-right' | 'top-left';
  /** frame shown when motion is reduced (1-based) */
  still: number;
  actions?: SceneAction[];
  list?: 'kitchenList';
};

export const SCENES: SceneDef[] = [
  { id: 'exterior', place: 'bottom-left', still: 1, actions: ['configure', 'projects'] },
  { id: 'entrada', place: 'middle-left', still: 40 },
  { id: 'rebedor', place: 'bottom-right', still: 60 },
  { id: 'salo', place: 'top-left', still: 30, actions: ['projects'] },
  { id: 'cuina', place: 'bottom-left', still: 60, list: 'kitchenList', actions: ['configure'] },
];

export type FrameInfo = { count: number; focusX: number; lg: number[]; sm: number[] };
export const FRAMES = frames as Record<string, FrameInfo>;

export const frameUrl = (id: string, variant: 'lg' | 'sm', n: number) =>
  `/frames/${id}/${variant}/${String(n).padStart(4, '0')}.webp?v=${FRAMES_VERSION}`;
