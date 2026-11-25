import type { SpaceId } from './i18n';

/*
  Built work. Empty until ModularDom supplies real projects: while it is, the gallery shows the
  concept house of the tour, labelled as a visualisation.

  To publish a project, add an entry (pictures in public/projects/<id>/) and it replaces the
  concept house in the gallery. Leave out any field that is not confirmed: the sheet only prints
  what it is given.
*/
export type Project = {
  id: string;
  name: string;
  /** municipality or area, as the owner agrees to publish it */
  location?: string;
  /** built surface in m² */
  surface?: number;
  year?: number;
  system?: 'cellular' | 'timber';
  /** short facts, already translated: { ca: [...], es: [...] } */
  features?: { ca: string[]; es: string[] };
  /** paths under /public, first one is the cover */
  images: string[];
};

export const PROJECTS: Project[] = [];

/** the concept house, room by room (stills cut from the film) */
export const CONCEPT_SPACES: { id: SpaceId; still: string; ratio: number }[] = [
  { id: 'facana', still: 'space-facana', ratio: 16 / 9 },
  { id: 'acces', still: 'space-acces', ratio: 2 / 3 },
  { id: 'llindar', still: 'space-llindar', ratio: 6 / 5 },
  { id: 'sala', still: 'space-sala', ratio: 16 / 9 },
  { id: 'escala', still: 'space-escala', ratio: 5 / 6 },
  { id: 'cuina', still: 'space-cuina', ratio: 16 / 9 },
];
