import { createHash } from 'node:crypto';
import { fetchPdf, registerQuote, storePdf } from '@/server/crm';
import { buildBudget } from '@/server/dossier';
import { env, leadsLive } from '@/server/env';
import { guardPost, json } from '@/server/guard';
import { toCrm, visitorTag, webReference } from '@/server/leads';
import { publicQuote } from '@/server/quote';
import { clientKey } from '@/server/rate-limit';
import { getTariff } from '@/server/tariff';
import { parseLead, phoneDigits } from '@/server/validate';

/*
  POST /api/budget — "Download budget".
  In this order, and stopping at the first step that fails:
    1. validate who asks and what was configured;
    2. compute the budget again here, with the tariff the CRM publishes (nothing priced comes from the browser);
    3. register client and budget in the CRM (which answers with the reference that stands: the
       original one if this same budget was already issued);
    4. build the PDF, or fetch the original if it already exists;
    5. store it privately in the CRM;
    6. send it to the browser.
  A PDF is only ever returned when every step before it succeeded. The request carries an id made
  by the browser for this click, so a retry registers nothing twice.
*/
export async function POST(req: Request) {
  const g = await guardPost(req, 'budget', { limit: 8, windowMs: 10 * 60_000, maxBytes: 1_600_000 });
  if ('error' in g) return g.error;
  const b = g.body as Record<string, unknown>;
  const parsed = parseLead({ ...b, kind: 'quote' });
  if ('errors' in parsed) {
    if (parsed.errors.some((e) => e.code === 'spam')) return json(202, { delivered: false, reason: 'disabled' });
    return json(422, { errors: parsed.errors });
  }
  const { lead } = parsed;
  const requestId = typeof b.requestId === 'string' && /^[0-9a-f-]{16,64}$/.test(b.requestId) ? b.requestId : null;
  if (!lead.config || !lead.visual || !requestId) return json(422, { errors: [{ field: 'config', code: 'invalid' }] });

  // 2. the price, recomputed
  const tariff = env.pricingPublic ? await getTariff() : null;
  if (!tariff) return json(202, { delivered: false, reason: 'no_price' });
  const quote = publicQuote(tariff.params, tariff.number, lead.config);
  if (!quote) return json(422, { errors: [{ field: 'config', code: 'invalid' }] });
  if (!leadsLive()) return json(202, { delivered: false, reason: 'disabled' });

  // 3. the CRM. The key names this person asking for this configuration with this tariff, on any day.
  const key = createHash('sha256')
    .update(`budget|${lead.email}|${lead.phone ? phoneDigits(lead.phone).slice(-9) : ''}|${JSON.stringify([lead.config, lead.visual])}|${quote.tariff}`)
    .digest('hex');
  const now = new Date();
  const reg = await registerQuote(
    toCrm(lead, quote, webReference(now), now, visitorTag(clientKey(req))),
    {
      tariff: quote.tariff, requestId, locale: lead.lang, lines: quote.lines, roof: quote.roof, subtotalCents: quote.subtotalCents,
      vatWorksCents: quote.vatWorksCents, vatArchitectCents: quote.vatArchitectCents, vatWorksPct: quote.vatWorksPct, vatArchitectPct: quote.vatArchitectPct,
      totalCents: quote.totalCents, hasPending: quote.hasPending, plot: lead.plot,
    },
    key,
  );
  if ('error' in reg) return reg.error === 'rate' ? json(429, { error: 'rate' }, { 'Retry-After': '3600' }) : json(502, { delivered: false, reason: reg.error });

  // 4–5. the document: the original if this budget was already issued, a new one otherwise
  let pdf: Uint8Array | null = reg.pdfStored ? ((await fetchPdf({ id: reg.id }))?.pdf ?? null) : null;
  if (!pdf) {
    let image: Uint8Array | null = null;
    if (typeof b.image === 'string' && b.image.startsWith('data:image/jpeg;base64,')) {
      const bytes = Buffer.from(b.image.slice(23), 'base64');
      // a real JPEG, of a size a canvas produces
      if (bytes.length > 2000 && bytes.length < 1_200_000 && bytes[0] === 0xff && bytes[1] === 0xd8) image = bytes;
    }
    pdf = await buildBudget({
      lang: lead.lang, reference: reg.reference, contact: { name: lead.name, email: lead.email, phone: lead.phone, city: lead.city, plot: lead.plot },
      config: lead.config, visual: lead.visual, quote, image, issued: new Date(reg.createdAt),
    });
    if (!(await storePdf(reg.id, pdf))) return json(502, { delivered: false, reason: 'storage' });
  }

  // 6. only now
  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="ModularDom-${reg.reference}.pdf"`, 'Cache-Control': 'no-store',
      'X-Reference': reg.reference, 'X-Version': String(reg.version), 'X-Reissued': reg.created ? '0' : '1', 'X-Recover': reg.token, 'X-Recover-Days': String(reg.tokenDays),
      'X-Total-Cents': String(quote.totalCents),
    },
  });
}
