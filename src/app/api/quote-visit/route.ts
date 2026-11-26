import { createHash } from 'node:crypto';
import { requestVisit } from '@/server/crm';
import { leadsLive } from '@/server/env';
import { guardPost, json } from '@/server/guard';
import { webReference } from '@/server/leads';

/*
  POST /api/quote-visit — "Book a visit to our show house", from a budget.
  The visitor has already said who they are when downloading the budget: the private link of that
  budget is enough for the CRM to tie the visit to the same client and budget. The visit is a
  request; ModularDom's team confirms it.
*/
export async function POST(req: Request) {
  const g = await guardPost(req, 'quote-visit', { limit: 6, windowMs: 10 * 60_000, maxBytes: 400 });
  if ('error' in g) return g.error;
  const b = g.body as Record<string, unknown>;
  const token = typeof b?.token === 'string' && /^[0-9a-f]{64}$/.test(b.token) ? b.token : null;
  if (!token) return json(422, { error: 'input' });
  if (!leadsLive()) return json(202, { delivered: false, reason: 'disabled' });
  const now = new Date();
  // one visit request per budget and day, however many times the button is pressed
  const key = createHash('sha256').update(`visit|${token}|${now.toISOString().slice(0, 10)}`).digest('hex');
  const reference = webReference(now);
  const out = await requestVisit(token, reference, key);
  if (!out) return json(404, { error: 'not_found' });
  if ('error' in out) return out.error === 'rate' ? json(429, { error: 'rate' }) : json(502, { delivered: false, reason: out.error });
  return json(200, { delivered: true, ...(out.duplicate ? { duplicate: true } : { reference }) });
}
