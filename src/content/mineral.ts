/*
  The MINERAL catalogue. Empty: ModularDom has not published any model of this line (nothing about
  it appears on modulardom.com). While it is empty the section shows what the catalogue will hold.

  To publish a model, add an entry; every field but the name is optional and only what is given is
  printed. Pictures and plans go in public/mineral/<id>/.
*/
export type MineralModel = {
  id: string;
  name: string;
  /** built surface in m² */
  surface?: number;
  /** e.g. { ca: '2 habitacions · 1 bany', es: '2 habitaciones · 1 baño' } */
  layout?: { ca: string; es: string };
  /** floor plan, ideally SVG */
  plan?: string;
  gallery?: string[];
  finishes?: { ca: string[]; es: string[] };
};

export const MINERAL_MODELS: MineralModel[] = [];
