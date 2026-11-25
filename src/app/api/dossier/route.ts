import { buildDossier } from '@/server/dossier';
import { env } from '@/server/env';
import { guardPost, json } from '@/server/guard';
import { webReference } from '@/server/leads';
import { publicQuote } from '@/server/quote';
import { getTariff } from '@/server/tariff';
import { parseEngineInput, parseVisual, text } from '@/server/validate';

/*
  POST /api/dossier — the configuration as a PDF.
  The browser sends the choices and a picture of its own 3D model; the server lays the document
  out and, if prices are switched on, computes the budget itself. Prices are never taken from
  the request.
*/
export async function POST(req: Request) {
  const g = await guardPost(req, 'dossier', { limit: 8, windowMs: 10 * 60_000, maxBytes: 1_600_000 });
  if ('error' in g) return g.error;
  const b = g.body as Record<string, unknown>;
  const config = parseEngineInput(b?.config);
  const visual = parseVisual(b?.visual);
  const lang = b?.lang === 'es' ? 'es' : 'ca';
  if (!config || !visual) return json(422, { error: 'input' });
  let image: Uint8Array | null = null;
  if (typeof b.image === 'string' && b.image.startsWith('data:image/jpeg;base64,')) {
    const bytes = Buffer.from(b.image.slice(23), 'base64');
    // a real JPEG, of a size a canvas produces
    if (bytes.length > 2000 && bytes.length < 1_200_000 && bytes[0] === 0xff && bytes[1] === 0xd8) image = bytes;
  }
  const tariff = env.pricingPublic ? await getTariff() : null;
  const quote = tariff ? publicQuote(tariff.params, tariff.number, config) : null;
  const reference = webReference();
  const pdf = await buildDossier({ lang, reference, name: text(b.name, 120), city: text(b.city, 120), config, visual, quote, image });
  return new Response(Buffer.from(pdf), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="ModularDom-${reference}.pdf"`, 'Cache-Control': 'no-store', 'X-Reference': reference },
  });
}
