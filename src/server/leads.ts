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

  Duplicates: the same person sending the same kind of request twice in a day produces the same
  idempotency key, so the CRM can drop the repeat; the key uses the CRM's own matching rules
  (e-mail lowercased and trimmed, last nine digits of the phone).
*/

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** a reference the visitor can quote; the CRM assigns its own codes (MD-YYYY-NNNN, PYY-NNN) later */
export function webReference(now = new Date()): string {
  const d = now.toISOString().slice(2, 10).replace(/-/g, '');
  let r = '';
  for (let i = 0; i < 4; i++) r += ALPHA[randomInt(ALPHA.length)];
  return `W${d}-${r}`;
}

export function dedupeKey(lead: Pick<LeadInput, 'email' | 'phone' | 'kind'>, now = new Date()): string {
  const phone = lead.phone ? phoneDigits(lead.phone).slice(-9) : '';
  return createHash('sha256').update(`${lead.email.trim().toLowerCase()}|${phone}|${lead.kind}|${now.toISOString().slice(0, 10)}`).digest('hex');
}

export type CrmLead = ReturnType<typeof toCrm>;

export function toCrm(lead: LeadInput, quote: PublicQuote | null, reference: string, now = new Date()) {
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
  };
}

const recent = new Map<string, number>();

export type Delivery = { delivered: boolean; duplicate?: boolean; reason?: 'disabled' | 'crm_error' | 'network' };

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
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key, 'X-ModularDom-Timestamp': ts, 'X-ModularDom-Signature': signature },
      body,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { delivered: false, reason: 'crm_error' };
    recent.set(key, now);
    return { delivered: true };
  } catch {
    return { delivered: false, reason: 'network' };
  }
}
