import { fetchPdf, recoverQuote } from '@/server/crm';
import { env, leadsLive } from '@/server/env';
import { guardPost, json } from '@/server/guard';
import { publicQuote } from '@/server/quote';
import { getTariff } from '@/server/tariff';
import { parseEngineInput, parseVisual } from '@/server/validate';

/*
  POST /api/recover — come back to a budget with its private link.
  The token travels in the body, never in a URL that reaches a log; it carries no personal data and
  the answer has none either: the configuration, the budget as it was issued, and what the same
  configuration costs with the tariff in force today. With { pdf: true } it returns the original PDF.
*/
export async function POST(req: Request) {
  const g = await guardPost(req, 'recover', { limit: 20, windowMs: 10 * 60_000, maxBytes: 400 });
  if ('error' in g) return g.error;
  const b = g.body as Record<string, unknown>;
  const token = typeof b?.token === 'string' && /^[0-9a-f]{64}$/.test(b.token) ? b.token : null;
  if (!token || !leadsLive()) return json(404, { error: 'not_found' });
  if (b.pdf === true) {
    const file = await fetchPdf({ token });
    if (!file) return json(404, { error: 'not_found' });
    return new Response(Buffer.from(file.pdf), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="ModularDom-${file.reference}.pdf"`, 'Cache-Control': 'no-store', 'X-Reference': file.reference },
    });
  }
  const rec = await recoverQuote(token);
  if (!rec) return json(404, { error: 'not_found' });
  if ('error' in rec) return rec.error === 'rate' ? json(429, { error: 'rate' }) : json(502, { error: 'unavailable' });
  // what comes back from the CRM goes through the same validation as what comes from a browser
  const config = parseEngineInput(rec.input);
  const visual = parseVisual(rec.visual);
  if (!config || !visual) return json(404, { error: 'not_found' });
  const tariff = env.pricingPublic ? await getTariff() : null;
  const current = tariff ? publicQuote(tariff.params, tariff.number, config) : null;
  return json(200, {
    config, visual,
    original: {
      reference: rec.reference, version: rec.version, createdAt: rec.createdAt, tariff: rec.tariff, lines: rec.lines, subtotalCents: rec.subtotalCents,
      vatWorksCents: rec.vatWorksCents, vatArchitectCents: rec.vatArchitectCents, totalCents: rec.totalCents, hasPending: rec.hasPending, pdf: rec.pdf,
    },
    visitRequested: rec.visitRequested,
    current: current ? { tariff: current.tariff, totalCents: current.totalCents, sameTariff: current.tariff === rec.tariff } : null,
  });
}
