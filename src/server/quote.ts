import { calculate, validateInput, type EngineInput, type RoofResult, type Tariff } from '@/lib/configurator/engine';

/*
  What a visitor may see of a budget: one amount per concept, the VAT, the total, and which tariff
  it was computed with. The engine's working figures stay behind: unit prices, the pre-discount
  amounts of the interior distribution, its discount rate and the per-room breakdown.

  An option the tariff has no validated price for is never shown as free: its line comes back
  `pending` with no amount, and the total says it leaves that line out.
*/
export type PublicLine = { key: string; label: { ca: string; es: string }; detail?: { ca: string; es: string }; amountCents: number; pending?: boolean };
export type PublicQuote = {
  tariff: string;
  validDays: number;
  lines: PublicLine[];
  /** pitched roofs only: the square metres considered and whether they are an estimate */
  roof: RoofResult | null;
  hasPending: boolean;
  subtotalCents: number;
  vatWorksCents: number;
  vatWorksPct: number;
  vatArchitectCents: number;
  vatArchitectPct: number;
  totalCents: number;
};

/** how each concept is named to a client (the engine keeps the CRM's own wording) */
const PUBLIC_LABEL: Record<string, { ca: string; es: string }> = {
  construccio: { ca: 'Construcció de l’habitatge', es: 'Construcción de la vivienda' },
  arquitecte: { ca: 'Honoraris tècnics', es: 'Honorarios técnicos' },
  fonamentacio: { ca: 'Fonamentació', es: 'Cimentación' },
  distribucio: { ca: 'Distribució interior', es: 'Distribución interior' },
  installacions: { ca: 'Climatització', es: 'Climatización' },
};

const NAMES: Record<string, { ca: string; es: string }> = {
  aerotermia: { ca: 'Aerotèrmia', es: 'Aerotermia' },
  aireConductos: { ca: 'Aire per conductes', es: 'Aire por conductos' },
  piscina: { ca: 'Piscina', es: 'Piscina' },
  porche: { ca: 'Porxo', es: 'Porche' },
  placasSolares: { ca: 'Plaques solars fotovoltaiques', es: 'Placas solares fotovoltaicas' },
};

export function publicQuote(tariff: Tariff, tariffNumber: string | number, input: EngineInput): PublicQuote | null {
  // options the published tariff does not price are set aside, to come back as pending lines
  const missingInst = input.installacions.filter((k) => !tariff.installacions_m2[k]);
  const missingExtras = input.extres.filter((k) => !tariff.extres[k]);
  const priced: EngineInput = { ...input, installacions: input.installacions.filter((k) => tariff.installacions_m2[k]), extres: input.extres.filter((k) => tariff.extres[k]) };
  if (validateInput(tariff, priced).length) return null;
  const q = calculate(tariff, priced);
  const lines: PublicLine[] = q.lines.map((l) => ({ key: l.key, label: PUBLIC_LABEL[l.key] ?? l.label, ...(l.detail ? { detail: l.detail } : {}), amountCents: l.amountCents, ...(l.pending ? { pending: true } : {}) }));
  for (const k of missingInst) lines.push({ key: `installacio:${k}`, label: NAMES[k] ?? { ca: k, es: k }, amountCents: 0, pending: true });
  for (const k of missingExtras) lines.push({ key: `extra:${k}`, label: NAMES[k] ?? { ca: k, es: k }, amountCents: 0, pending: true });
  return {
    tariff: String(tariffNumber),
    validDays: 30,
    lines,
    roof: q.roof ?? null,
    hasPending: lines.some((l) => l.pending),
    subtotalCents: q.subtotalCents,
    vatWorksCents: q.ivaObraCents,
    vatWorksPct: tariff.iva_obra_pct,
    vatArchitectCents: q.ivaArqCents,
    vatArchitectPct: tariff.iva_arquitecte_pct,
    totalCents: q.totalCents,
  };
}
