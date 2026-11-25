/*
  ModularDom's budget engine, ported line for line from the one the company runs today
  (https://www.modulardom.com/presupuesto/assets/motor.js, "generat des del CRM"), so that the
  new configurator and the CRM compute the same figures. Amounts are integer cents.

  It ships WITHOUT a tariff: prices are managed in ModularDom's CRM and published by an
  authorised action there. Until a tariff is supplied (see tariff.ts) nothing is calculated
  and no figure is shown.
*/

type L10n = { ca: string; es: string };

export type Tariff = {
  construccio_m2: number;
  fonamentacio_m2: number;
  arquitecte_m2: number;
  arquitecte_fix: number;
  escomeses: number;
  metres_minims: number;
  iva_obra_pct: number;
  iva_arquitecte_pct: number;
  intern: { habitacio: number; bany: number; safareig: number; suite_bany: number; suite_bany_vestidor: number };
  distribucio_descompte_pct: number;
  garatge: { primer_vehicle: number; vehicle_addicional: number; max_vehicles: number };
  cuina: { basica: number; illa: number };
  installacions_m2: Record<string, { nom: L10n; preu_m2: number }>;
  extres: Record<string, { nom: L10n; preu: number }>;
  opcions: { habitacions: number[]; banys: number[] };
};

/** what the visitor has chosen, in the engine's own vocabulary */
export type EngineInput = {
  metres: number;
  habitacions: number;
  banys: number;
  suite: 'sin' | 'bano' | 'bano_vestidor';
  cuina: 'basica' | 'isla';
  vehicles: number;
  safareig: boolean;
  installacions: string[];
  extres: string[];
};

export type QuoteLine = {
  key: string;
  label: L10n;
  amountCents: number;
  vat: 'obra' | 'arquitectura';
  quantity?: number;
  unitPriceCents?: number;
  originalCents?: number;
  discountPct?: number;
  detail?: L10n;
};

export type Quote = {
  lines: QuoteLine[];
  baseObraCents: number;
  baseArqCents: number;
  subtotalCents: number;
  ivaObraCents: number;
  ivaArqCents: number;
  totalCents: number;
};

const LBL = {
  construccio: { ca: 'Construcció', es: 'Construcción' },
  arquitecte: { ca: "Honoraris d'arquitecte", es: 'Honorarios de arquitecto' },
  fonamentacio: { ca: 'Fonamentació', es: 'Cimentación' },
  escomeses: { ca: 'Acometides i sanejament', es: 'Acometidas y saneamiento' },
  distribucio: { ca: 'Distribució interior personalitzada', es: 'Distribución interior personalizada' },
  cuina: { ca: 'Cuina', es: 'Cocina' },
  installacions: { ca: 'Instal·lacions', es: 'Instalaciones' },
};
const KITCHEN_LABEL = { basica: { ca: 'Cuina bàsica', es: 'Cocina básica' }, isla: { ca: 'Cuina amb illa', es: 'Cocina con isla' } };
const garageLabel = (n: number): L10n => (n === 1 ? { ca: 'Garatge (1 vehicle)', es: 'Garaje (1 vehículo)' } : { ca: `Garatge (${n} vehicles)`, es: `Garaje (${n} vehículos)` });
const eur = (e: number) => Math.round(e * 100);
const pct = (cents: number, p: number) => Math.round((cents * Math.round(p * 100)) / 1e4);

export function validateInput(p: Tariff, c: EngineInput): { field: string; code: string }[] {
  const e: { field: string; code: string }[] = [];
  if (!Number.isInteger(c.metres) || c.metres < p.metres_minims) e.push({ field: 'metres', code: 'min' });
  if (!p.opcions.habitacions.includes(c.habitacions)) e.push({ field: 'habitacions', code: 'option' });
  if (!p.opcions.banys.includes(c.banys)) e.push({ field: 'banys', code: 'option' });
  if (!['sin', 'bano', 'bano_vestidor'].includes(c.suite)) e.push({ field: 'suite', code: 'option' });
  if (!['basica', 'isla'].includes(c.cuina)) e.push({ field: 'cuina', code: 'option' });
  if (!Number.isInteger(c.vehicles) || c.vehicles < 0 || c.vehicles > p.garatge.max_vehicles) e.push({ field: 'vehicles', code: 'option' });
  for (const k of c.installacions) if (!p.installacions_m2[k]) e.push({ field: 'installacions', code: 'unknown' });
  for (const k of c.extres) if (!p.extres[k]) e.push({ field: 'extres', code: 'unknown' });
  return e;
}

export function calculate(p: Tariff, c: EngineInput): Quote {
  const m = c.metres;
  const lines: QuoteLine[] = [];
  const internal = {
    habitacions: c.habitacions * eur(p.intern.habitacio),
    banys: c.banys * eur(p.intern.bany),
    suite: c.suite === 'bano' ? eur(p.intern.suite_bany) : c.suite === 'bano_vestidor' ? eur(p.intern.suite_bany_vestidor) : 0,
    safareig: c.safareig ? eur(p.intern.safareig) : 0,
  };
  if (m > 0) {
    lines.push({ key: 'construccio', label: LBL.construccio, amountCents: m * eur(p.construccio_m2), vat: 'obra', quantity: m, unitPriceCents: eur(p.construccio_m2) });
    lines.push({ key: 'arquitecte', label: LBL.arquitecte, amountCents: m * eur(p.arquitecte_m2) + eur(p.arquitecte_fix), vat: 'arquitectura' });
    lines.push({ key: 'fonamentacio', label: LBL.fonamentacio, amountCents: m * eur(p.fonamentacio_m2), vat: 'obra', quantity: m, unitPriceCents: eur(p.fonamentacio_m2) });
    lines.push({ key: 'escomeses', label: LBL.escomeses, amountCents: eur(p.escomeses), vat: 'obra' });
  }
  const distOriginal = internal.habitacions + internal.banys + internal.suite + internal.safareig;
  if (distOriginal > 0) {
    lines.push({
      key: 'distribucio',
      label: LBL.distribucio,
      originalCents: distOriginal,
      discountPct: p.distribucio_descompte_pct,
      amountCents: distOriginal - pct(distOriginal, p.distribucio_descompte_pct),
      vat: 'obra',
    });
  }
  const kitchen = c.cuina === 'isla' ? eur(p.cuina.illa) : c.cuina === 'basica' ? eur(p.cuina.basica) : 0;
  if (kitchen > 0) lines.push({ key: 'cuina', label: LBL.cuina, amountCents: kitchen, vat: 'obra', detail: KITCHEN_LABEL[c.cuina] });
  const inst = c.installacions.filter((k) => p.installacions_m2[k]);
  const instCents = inst.reduce((s, k) => s + m * eur(p.installacions_m2[k].preu_m2), 0);
  if (instCents > 0) {
    lines.push({
      key: 'installacions',
      label: LBL.installacions,
      amountCents: instCents,
      vat: 'obra',
      detail: { ca: inst.map((k) => p.installacions_m2[k].nom.ca).join(', '), es: inst.map((k) => p.installacions_m2[k].nom.es).join(', ') },
    });
  }
  const garage = c.vehicles ? eur(p.garatge.primer_vehicle) + (c.vehicles - 1) * eur(p.garatge.vehicle_addicional) : 0;
  if (garage > 0) lines.push({ key: 'garatge', label: garageLabel(c.vehicles), amountCents: garage, vat: 'obra' });
  for (const k of c.extres) {
    if (p.extres[k]) lines.push({ key: `extra:${k}`, label: p.extres[k].nom, amountCents: eur(p.extres[k].preu), vat: 'obra' });
  }
  const baseArqCents = lines.filter((l) => l.vat === 'arquitectura').reduce((s, l) => s + l.amountCents, 0);
  const baseObraCents = lines.filter((l) => l.vat === 'obra').reduce((s, l) => s + l.amountCents, 0);
  const ivaObraCents = pct(baseObraCents, p.iva_obra_pct);
  const ivaArqCents = pct(baseArqCents, p.iva_arquitecte_pct);
  const subtotalCents = baseObraCents + baseArqCents;
  return { lines, baseObraCents, baseArqCents, subtotalCents, ivaObraCents, ivaArqCents, totalCents: subtotalCents + ivaObraCents + ivaArqCents };
}
