import { PRICING } from '@/content/site';
import type { Tariff } from './engine';

/*
  Where the prices come from. Today: nowhere. ModularDom publishes its tariff from the CRM
  (the current site reads it from the CRM's /api/configurador/tarifa.js); this site carries no
  copy of it, so a stale price can never be shown.

  To switch budgets on, with ModularDom's authorisation: set PRICING.enabled and
  PRICING.tariffUrl (a JSON document with the shape of `Tariff`) in src/content/site.ts.
  The configurator then shows the breakdown computed by engine.ts.
*/
let cache: Promise<Tariff | null> | null = null;

export function loadTariff(): Promise<Tariff | null> {
  if (!PRICING.enabled || !PRICING.tariffUrl) return Promise.resolve(null);
  cache ??= fetch(PRICING.tariffUrl, { cache: 'no-store' })
    .then((r) => (r.ok ? (r.json() as Promise<Tariff>) : null))
    .catch(() => null);
  return cache;
}
