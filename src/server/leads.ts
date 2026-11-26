import { createHash, createHmac, randomInt } from 'node:crypto';
import { env, leadsLive } from './env';
import type { PublicQuote } from './quote';
import { phoneDigits, type LeadInput } from './validate';

/*
  From a validated form to a lead in ModularDom's CRM.

  The CRM has no intake endpoint for the website yet (its only public routes publish the tariff),
  so nothing is delivered today. This module builds the exact payload, signs it and is ready to
  post it; docs/crm-integration.md is the contract the CRM side needs to implement. Field names
  follow the CRM's own model (clients, projects, quote_versions.configurator_input).

  Duplicates: the idempotency key identifies one request, not one person. The same person sending
  the same content twice in a day (a double click, a retry after a time-out) produces the same key
  and the CRM drops the repeat. A second request from that person with anything different in it
  (another configuration, another message, another kind) is a new request and gets a new key.
  The person part of the key uses the CRM's own matching rules (e-mail lowercased and trimmed,
  last nine digits of the phone).
*/

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** a reference the visitor can quote; the CRM assigns its own codes (MD-YYYY-NNNN, PYY-NNN) later */
export function webReference(now = new Date()): string {
  const d = now.toISOString().slice(2, 10).replace(/-/g, '');
  let r = '';
  for (let i = 0; i < 4; i++) r += ALPHA[randomInt(ALPHA.length)];
  return `W${d}-${r}`;
}

type KeyFields = Pick<LeadInput, 'email' | 'phone' | 'kind'> & Partial<Omit<LeadInput, 'email' | 'phone' | 'kind'>>;
const squash = (v: string | null | undefined) => (v ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

export function dedupeKey(lead: KeyFields, now = new Date()): string {
  const phone = lead.phone ? phoneDigits(lead.phone).slice(-9) : '';
  // what was asked: two requests are the same only if all of this is the same
  const content = JSON.stringify([
    squash(lead.city), squash(lead.company), lead.plot ?? null, squash(lead.plotNote), squash(lead.message),
    squash(lead.establishment), lead.units ?? null, lead.config ?? null, lead.visual ?? null,
  ]);
  return createHash('sha256').update(`${lead.email.trim().toLowerCase()}|${phone}|${lead.kind}|${now.toISOString().slice(0, 10)}|${content}`).digest('hex');
}

/** a stable pseudonym for the visitor's address, so the CRM can keep a durable per-visitor limit without ever seeing the address */
export function visitorTag(address: string): string | null {
  if (!env.leadSecret || !address) return null;
  return createHmac('sha256', env.leadSecret).update(`visitor:${address}`).digest('hex').slice(0, 32);
}

export type CrmLead = ReturnType<typeof toCrm>;

export function toCrm(lead: LeadInput, quote: PublicQuote | null, reference: string, now = new Date(), visitor: string | null = null) {
  const notes: string[] = [];
  if (lead.kind === 'visit') notes.push(lead.lang === 'ca' ? 'Sol·licita visitar la casa pilot de Bellvís.' : 'Solicita visitar la casa piloto de Bellvís.');
  if (lead.kind === 'mineral') notes.push(`MINERAL · ${lead.establishment ?? '—'} · ${lead.units ?? '—'} u.`);
  if (lead.plot) notes.push(`Terreny: ${{ yes: 'en té', no: 'no en té', searching: 'en busca' }[lead.plot]}${lead.plotNote ? ` (${lead.plotNote})` : ''}`);
  if (lead.message) notes.push(lead.message);
  return {
    reference,
    capturedAt: now.toISOString(),
    // clients.lead_source: 'configurador' when a configuration comes with it, 'web' otherwise
    source: lead.kind === 'quote' ? ('configurador' as const) : ('web' as const),
    kind: lead.kind,
    page: lead.page,
    client: {
      kind: lead.company ? ('empresa' as const) : ('persona' as const),
      display_name: lead.company ? `${lead.company} (${lead.name})` : lead.name,
      email: lead.email,
      phone: lead.phone,
      locale: lead.lang,
      city: lead.city,
    },
    project: {
      municipality: lead.city,
      plot_address: lead.plotNote,
      surface_m2: lead.config?.metres ?? null,
    },
    // quote_versions.configurator_input, in the engine's own vocabulary
    configurator: lead.config ? { input: lead.config, visual: lead.visual, tariff: quote?.tariff ?? null, totalCents: quote?.totalCents ?? null } : null,
    notes: notes.join('\n'),
    // only sent when there is one: the CRM uses it for its durable rate limit and does not store it
    ...(visitor ? { visitor } : {}),
  };
}

const recent = new Map<string, number>();

export type Delivery = { delivered: boolean; duplicate?: boolean; reason?: 'disabled' | 'crm_error' | 'network' | 'rate' };

export async function deliver(payload: CrmLead, key: string): Promise<Delivery> {
  if (!leadsLive()) return { delivered: false, reason: 'disabled' };
  const now = Date.now();
  for (const [k, t] of recent) if (now - t > 10 * 60 * 1000) recent.delete(k);
  if (recent.has(key)) return { delivered: true, duplicate: true };
  const body = JSON.stringify(payload);
  const ts = String(Math.floor(now / 1000));
  // the CRM verifies this before trusting the body: HMAC-SHA256 of "<timestamp>.<body>"
  const signature = createHmac('sha256', env.leadSecret!).update(`${ts}.${body}`).digest('hex');
  try {
    const res = await fetch(env.leadUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'Idempotency-Key': key, 'X-ModularDom-Timestamp': ts, 'X-ModularDom-Signature': signature,
        // only for a CRM preview deployment behind Vercel's Deployment Protection; never needed in production
        ...(env.crmProtectionBypass ? { 'x-vercel-protection-bypass': env.crmProtectionBypass } : {}),
      },
      redirect: 'error',
      body,
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 429) return { delivered: false, reason: 'rate' };
    if (!res.ok) return { delivered: false, reason: 'crm_error' };
    recent.set(key, now);
    return { delivered: true };
  } catch {
    return { delivered: false, reason: 'network' };
  }
}
