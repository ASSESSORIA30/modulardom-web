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
  /** pitched roofs (optional: a tariff without this block cannot price them). The flat roof is the standard, with no supplement. */
  coberta?: RoofParams;
};
export type RoofParams = {
  inclinada: { preu_m2: number; pendent_pct: number };
  dues_aigues: { preu_m2: number; pendent_pct: number };
  volada_m: number;
  proporcio: number;
};
export type RoofType = 'plana' | 'inclinada' | 'dues_aigues';

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
  /* added with the roofs; all optional, so an older configuration means "one floor, flat roof" */
  plantes?: 1 | 2;
  coberta?: RoofType;
  /** measured roof area (once there are drawings); estimated when absent */
  coberta_m2?: number;
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
  /** chosen but without a validated price: it adds nothing (amountCents = 0) and must be shown as "to be priced" */
  pending?: boolean;
};
export type RoofResult = { type: RoofType; areaM2: number; estimated: boolean; priced: boolean };

export type Quote = {
  lines: QuoteLine[];
  baseObraCents: number;
  baseArqCents: number;
  subtotalCents: number;
  ivaObraCents: number;
  ivaArqCents: number;
  totalCents: number;
  roof?: RoofResult;
  pending: string[];
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
const ROOF_LABEL: Record<Exclude<RoofType, 'plana'>, L10n> = {
  inclinada: { ca: "Coberta inclinada d'una aigua", es: 'Cubierta inclinada a un agua' },
  dues_aigues: { ca: 'Coberta a dues aigües', es: 'Cubierta a dos aguas' },
};
const m2Text = (a: number) => a.toFixed(1).replace('.', ',');

/**
 * Pitched roof area (m², one decimal), estimated without drawings: footprint = built m² / floors, as a
 * rectangle with the tariff's proportion, plus the overhang on each side, projected onto the slope.
 */
export function estimateRoofArea(metres: number, plantes: 1 | 2, pendentPct: number, voladaM: number, proporcio: number): number {
  const footprint = metres / plantes;
  const length = Math.sqrt(footprint * proporcio);
  const width = footprint / length;
  const plan = (length + 2 * voladaM) * (width + 2 * voladaM);
  return Math.round(plan * Math.sqrt(1 + (pendentPct / 100) ** 2) * 10) / 10;
}
export function roofParamsValid(r: RoofParams | undefined): r is RoofParams {
  const ok = (n: unknown, min: number, max: number) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
  return !!r && [r.inclinada, r.dues_aigues].every((x) => !!x && ok(x.preu_m2, 0, 10000) && ok(x.pendent_pct, 1, 100)) && ok(r.volada_m, 0, 3) && ok(r.proporcio, 1, 4);
}

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
  if (c.plantes !== undefined && c.plantes !== 1 && c.plantes !== 2) e.push({ field: 'plantes', code: 'option' });
  if (c.coberta !== undefined && !['plana', 'inclinada', 'dues_aigues'].includes(c.coberta)) e.push({ field: 'coberta', code: 'option' });
  if (c.coberta_m2 !== undefined && !(typeof c.coberta_m2 === 'number' && c.coberta_m2 > 0 && c.coberta_m2 <= 5000)) e.push({ field: 'coberta_m2', code: 'range' });
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
  // roof: flat is the standard (no line); pitched roofs are charged per m² of roof, not of built surface
  let roof: RoofResult | undefined;
  if (c.coberta === 'inclinada' || c.coberta === 'dues_aigues') {
    const label = ROOF_LABEL[c.coberta];
    if (roofParamsValid(p.coberta)) {
      const rp = p.coberta[c.coberta];
      const estimated = c.coberta_m2 === undefined;
      const area = estimated ? estimateRoofArea(m, c.plantes ?? 1, rp.pendent_pct, p.coberta.volada_m, p.coberta.proporcio) : Math.round(c.coberta_m2! * 10) / 10;
      roof = { type: c.coberta, areaM2: area, estimated, priced: true };
      lines.push({
        key: 'coberta', label, amountCents: Math.round(area * eur(rp.preu_m2)), vat: 'obra', quantity: area, unitPriceCents: eur(rp.preu_m2),
        detail: estimated
          ? { ca: `${m2Text(area)} m² de coberta (superfície estimada)`, es: `${m2Text(area)} m² de cubierta (superficie estimada)` }
          : { ca: `${m2Text(area)} m² de coberta (superfície mesurada)`, es: `${m2Text(area)} m² de cubierta (superficie medida)` },
      });
    } else {
      roof = { type: c.coberta, areaM2: 0, estimated: true, priced: false };
      lines.push({ key: 'coberta', label, amountCents: 0, vat: 'obra', pending: true });
    }
  }
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
  return { lines, baseObraCents, baseArqCents, subtotalCents, ivaObraCents, ivaArqCents, totalCents: subtotalCents + ivaObraCents + ivaArqCents, ...(roof ? { roof } : {}), pending: lines.filter((l) => l.pending).map((l) => l.key) };
}
