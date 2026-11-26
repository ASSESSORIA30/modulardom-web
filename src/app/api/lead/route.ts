import { env } from '@/server/env';
import { guardPost, json } from '@/server/guard';
import { dedupeKey, deliver, toCrm, visitorTag, webReference } from '@/server/leads';
import { clientKey } from '@/server/rate-limit';
import { publicQuote } from '@/server/quote';
import { getTariff } from '@/server/tariff';
import { parseLead } from '@/server/validate';

/*
  POST /api/lead — every form of the site ends here.
  Answers { delivered: true, reference } only when the CRM has accepted the lead. While the
  integration is off it answers { delivered: false, reason: 'disabled' } and the page says so:
  nobody is told a request was received when it was not.
*/
export async function POST(req: Request) {
  const g = await guardPost(req, 'lead', { limit: 6, windowMs: 10 * 60_000, maxBytes: 8_000 });
  if ('error' in g) return g.error;
  const parsed = parseLead(g.body);
  if ('errors' in parsed) {
    // a bot gets the same answer as a success would give it nothing to learn from
    if (parsed.errors.some((e) => e.code === 'spam')) return json(200, { delivered: false, reason: 'disabled' });
    return json(422, { errors: parsed.errors });
  }
  const { lead } = parsed;
  const tariff = lead.config && env.pricingPublic ? await getTariff() : null;
  const quote = tariff && lead.config ? publicQuote(tariff.params, tariff.number, lead.config) : null;
  const reference = webReference();
  const result = await deliver(toCrm(lead, quote, reference, new Date(), visitorTag(clientKey(req))), dedupeKey(lead));
  // the CRM keeps the durable limit (per visitor, in its database); the form already knows how to say it
  if (result.reason === 'rate') return json(429, { error: 'rate' }, { 'Retry-After': '3600' });
  return json(result.delivered ? 200 : 202, { ...result, ...(result.delivered ? { reference } : {}) });
}
