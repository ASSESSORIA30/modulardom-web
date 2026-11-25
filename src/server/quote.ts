import { calculate, validateInput, type EngineInput, type Tariff } from '@/lib/configurator/engine';

/*
  What a visitor may see of a budget: one amount per concept, the VAT, the total, and which tariff
  it was computed with. The engine's working figures stay behind: unit prices, the pre-discount
  amounts of the interior distribution, its discount rate and the per-room breakdown.
*/
export type PublicQuote = {
  tariff: string;
  validDays: number;
  lines: { key: string; label: { ca: string; es: string }; detail?: { ca: string; es: string }; amountCents: number }[];
  subtotalCents: number;
  vatWorksCents: number;
  vatArchitectCents: number;
  totalCents: number;
};

export function publicQuote(tariff: Tariff, tariffNumber: string | number, input: EngineInput): PublicQuote | null {
  if (validateInput(tariff, input).length) return null;
  const q = calculate(tariff, input);
  return {
    tariff: String(tariffNumber),
    validDays: 30,
    lines: q.lines.map((l) => ({ key: l.key, label: l.label, ...(l.detail ? { detail: l.detail } : {}), amountCents: l.amountCents })),
    subtotalCents: q.subtotalCents,
    vatWorksCents: q.ivaObraCents,
    vatArchitectCents: q.ivaArqCents,
    totalCents: q.totalCents,
  };
}
