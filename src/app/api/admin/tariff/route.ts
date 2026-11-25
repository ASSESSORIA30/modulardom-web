import { timingSafeEqual } from 'node:crypto';
import { env, leadsLive } from '@/server/env';
import { json } from '@/server/guard';
import { allow, clientKey } from '@/server/rate-limit';
import { getTariff } from '@/server/tariff';

/*
  /api/admin/tariff — for ModularDom's staff, not for visitors.

  Prices are edited in the CRM (Administració › Tarifes), by its "direcció" users, and published
  from there; this site deliberately has no second editor and no second login. This route only
  lets an authorised person check which tariff the website is using and make it re-read the CRM.

  It needs a bearer token (ADMIN_TOKEN). Without that variable the route answers 404, as if it
  did not exist. It never returns prices.
*/
function authorised(req: Request): boolean {
  if (!env.adminToken) return false;
  const given = Buffer.from((req.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''));
  const want = Buffer.from(env.adminToken);
  return given.length === want.length && timingSafeEqual(given, want);
}

async function handle(req: Request, refresh: boolean) {
  if (!env.adminToken) return new Response(null, { status: 404 });
  if (!allow(`admin:${clientKey(req)}`, 10, 60_000)) return json(429, { error: 'rate' });
  if (!authorised(req)) return json(401, { error: 'unauthorised' });
  const t = await getTariff(refresh);
  return json(200, {
    source: env.tariffUrl ? new URL(env.tariffUrl).host : null,
    published: t ? { number: t.number, effectiveFrom: t.effectiveFrom, publishedAt: t.publishedAt } : null,
    pricesShownToVisitors: env.pricingPublic && !!t,
    leadsDelivered: leadsLive(),
  });
}

export const GET = (req: Request) => handle(req, false);
/** POST re-reads the tariff from the CRM now instead of waiting for the cache to expire */
export const POST = (req: Request) => handle(req, true);
