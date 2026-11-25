import { allow, clientKey } from './rate-limit';

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });

/**
 * The checks every public POST goes through before its own logic: it must come from this site's
 * own pages (same origin), carry JSON of a sane size, and stay under the route's rate.
 * Returns the parsed body, or the Response to send back.
 */
export async function guardPost(req: Request, route: string, opts: { limit: number; windowMs: number; maxBytes: number }): Promise<{ body: unknown } | { error: Response }> {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (!origin || !host || new URL(origin).host !== host) return { error: json(403, { error: 'origin' }) };
  if (!(req.headers.get('content-type') || '').includes('application/json')) return { error: json(415, { error: 'content_type' }) };
  if (!allow(`${route}:${clientKey(req)}`, opts.limit, opts.windowMs)) return { error: json(429, { error: 'rate' }, { 'Retry-After': String(Math.ceil(opts.windowMs / 1000)) }) };
  const text = await req.text();
  if (text.length > opts.maxBytes) return { error: json(413, { error: 'size' }) };
  try {
    return { body: JSON.parse(text) };
  } catch {
    return { error: json(400, { error: 'json' }) };
  }
}

export { json };
