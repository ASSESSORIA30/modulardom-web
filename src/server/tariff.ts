import type { Tariff } from '@/lib/configurator/engine';
import { env } from './env';

/*
  The tariff, on the server only.

  ModularDom manages its prices in the CRM (Administració › Tarifes) and publishes them from
  there. This site keeps no copy: the server reads the published tariff from the CRM when it needs
  it, holds it in memory for a few minutes, and never sends it to a browser. What a visitor
  receives is the result of the calculation (src/server/quote.ts), not the numbers behind it.
*/

export type PublishedTariff = { number: string | number; effectiveFrom: string | null; publishedAt: string | null; params: Tariff };

const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const rec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const l10n = (v: unknown) => rec(v) && typeof v.ca === 'string' && typeof v.es === 'string';

/** refuses anything that is not exactly the shape the engine expects */
export function isTariff(p: unknown): p is Tariff {
  if (!rec(p)) return false;
  for (const k of ['construccio_m2', 'fonamentacio_m2', 'arquitecte_m2', 'arquitecte_fix', 'escomeses', 'metres_minims', 'iva_obra_pct', 'iva_arquitecte_pct', 'distribucio_descompte_pct']) if (!num(p[k])) return false;
  const i = p.intern;
  if (!rec(i) || !['habitacio', 'bany', 'safareig', 'suite_bany', 'suite_bany_vestidor'].every((k) => num(i[k]))) return false;
  const g = p.garatge;
  if (!rec(g) || !['primer_vehicle', 'vehicle_addicional', 'max_vehicles'].every((k) => num(g[k]))) return false;
  const c = p.cuina;
  if (!rec(c) || !num(c.basica) || !num(c.illa)) return false;
  if (!rec(p.installacions_m2) || !Object.values(p.installacions_m2).every((x) => rec(x) && l10n(x.nom) && num(x.preu_m2))) return false;
  if (!rec(p.extres) || !Object.values(p.extres).every((x) => rec(x) && l10n(x.nom) && num(x.preu))) return false;
  const o = p.opcions;
  return rec(o) && Array.isArray(o.habitacions) && Array.isArray(o.banys) && [...o.habitacions, ...o.banys].every((n) => Number.isInteger(n));
}

let cache: { at: number; value: PublishedTariff | null } | null = null;
const TTL = 5 * 60 * 1000;

export async function getTariff(force = false): Promise<PublishedTariff | null> {
  if (!env.tariffUrl) return null;
  if (!force && cache && Date.now() - cache.at < TTL) return cache.value;
  let value: PublishedTariff | null = null;
  try {
    const res = await fetch(env.tariffUrl, { cache: 'no-store', signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      if (rec(data) && isTariff(data.params)) {
        value = { number: (data.number as string | number) ?? '', effectiveFrom: (data.effectiveFrom as string) ?? null, publishedAt: (data.publishedAt as string) ?? null, params: data.params };
      }
    }
  } catch {
    // an unreachable CRM means no prices, never stale or guessed ones
    value = cache?.value ?? null;
  }
  cache = { at: Date.now(), value };
  return value;
}
