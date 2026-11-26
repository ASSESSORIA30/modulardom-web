import { env } from '@/server/env';
import { guardPost, json } from '@/server/guard';
import { publicQuote } from '@/server/quote';
import { getTariff } from '@/server/tariff';
import { parseEngineInput } from '@/server/validate';

/*
  POST /api/quote — the indicative budget for a configuration.
  The tariff never leaves the server: the answer is the result only. While prices are not
  switched on (PRICING_PUBLIC) or no tariff is published, the answer is { enabled: false }.
*/
export async function POST(req: Request) {
  const g = await guardPost(req, 'quote', { limit: 40, windowMs: 60_000, maxBytes: 2_000 });
  if ('error' in g) return g.error;
  const input = parseEngineInput(g.body);
  if (!input) return json(422, { error: 'input' });
  if (!env.pricingPublic) return json(200, { enabled: false });
  const tariff = await getTariff();
  if (!tariff) return json(200, { enabled: false });
  const quote = publicQuote(tariff.params, tariff.number, input);
  return quote ? json(200, { enabled: true, quote }) : json(422, { error: 'input' });
}
