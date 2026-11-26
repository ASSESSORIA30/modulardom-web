import { createHash, createHmac } from 'node:crypto';
import { env } from './env';

/*
  Signed calls from this server to the CRM's web endpoints (/api/web/quotes and its siblings).
  Same scheme as the leads: HMAC-SHA256 of "<timestamp>.<what is signed>" with the shared secret.
  For JSON the body itself is signed; for the PDF, a short text carrying its SHA-256.
*/

const base = () => env.leadUrl!.replace(/\/leads\/?$/, '');
const sha = (d: string | Uint8Array) => createHash('sha256').update(d).digest('hex');

async function call(pathname: string, o: { method?: string; body: string | Uint8Array; contentType: string; signed?: string; key?: string; timeoutMs?: number }): Promise<Response | null> {
  const ts = String(Math.floor(Date.now() / 1000));
  const signature = createHmac('sha256', env.leadSecret!).update(`${ts}.${o.signed ?? (o.body as string)}`).digest('hex');
  try {
    return await fetch(base() + pathname, {
      method: o.method ?? 'POST',
      headers: {
        'Content-Type': o.contentType, 'X-ModularDom-Timestamp': ts, 'X-ModularDom-Signature': signature,
        ...(o.key ? { 'Idempotency-Key': o.key } : {}),
        ...(env.crmProtectionBypass ? { 'x-vercel-protection-bypass': env.crmProtectionBypass } : {}),
      },
      body: o.body as BodyInit,
      redirect: 'error',
      signal: AbortSignal.timeout(o.timeoutMs ?? 10_000),
    });
  } catch {
    return null;
  }
}
const postJson = (pathname: string, data: unknown, key?: string) => call(pathname, { body: JSON.stringify(data), contentType: 'application/json', key });

export type Registered = { id: string; reference: string; version: number; created: boolean; createdAt: string; pdfStored: boolean; token: string; tokenDays: number };
export type CrmFailure = { error: 'rate' | 'crm_error' | 'network' };

export async function registerQuote(lead: unknown, quote: unknown, key: string): Promise<Registered | CrmFailure> {
  const res = await postJson('/quotes', { lead, quote }, key);
  if (!res) return { error: 'network' };
  if (res.status === 429) return { error: 'rate' };
  if (!res.ok) return { error: 'crm_error' };
  return (await res.json()) as Registered;
}

export async function storePdf(id: string, pdf: Uint8Array): Promise<boolean> {
  const res = await call(`/quotes/pdf?id=${id}`, { method: 'PUT', body: pdf, contentType: 'application/pdf', signed: `${id}.${sha(pdf)}`, timeoutMs: 20_000 });
  return !!res && res.ok;
}

export async function fetchPdf(by: { id: string } | { token: string }): Promise<{ pdf: Uint8Array; reference: string } | null> {
  const res = await postJson('/quotes/pdf', by);
  if (!res || !res.ok || !(res.headers.get('content-type') ?? '').startsWith('application/pdf')) return null;
  const pdf = new Uint8Array(await res.arrayBuffer());
  return pdf.length > 4 ? { pdf, reference: res.headers.get('x-reference') ?? '' } : null;
}

export type Recovered = {
  reference: string; version: number; createdAt: string; tariff: string; locale: 'ca' | 'es'; input: unknown; visual: unknown;
  lines: { key: string; label: { ca: string; es: string }; detail?: { ca: string; es: string }; amountCents: number; pending?: boolean }[];
  subtotalCents: number; vatWorksCents: number; vatArchitectCents: number; totalCents: number; hasPending: boolean; pdf: boolean; visitRequested: boolean;
};
export async function recoverQuote(token: string): Promise<Recovered | null | CrmFailure> {
  const res = await postJson('/quotes/recover', { token });
  if (!res) return { error: 'network' };
  if (res.status === 404) return null;
  if (res.status === 429) return { error: 'rate' };
  if (!res.ok) return { error: 'crm_error' };
  return (await res.json()) as Recovered;
}

export async function requestVisit(token: string, reference: string, key: string): Promise<{ quoteReference: string; duplicate?: boolean } | null | CrmFailure> {
  const res = await postJson('/quotes/visit', { token, reference }, key);
  if (!res) return { error: 'network' };
  if (res.status === 404) return null;
  if (res.status === 429) return { error: 'rate' };
  if (!res.ok) return { error: 'crm_error' };
  return (await res.json()) as { quoteReference: string; duplicate?: boolean };
}
