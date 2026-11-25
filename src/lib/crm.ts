import { CRM } from '@/content/site';

/*
  The one door every form on the site goes through. While CRM.enabled is false nothing leaves the
  browser: the lead is validated, returned to the caller and dropped. To connect ModularDom's CRM,
  set CRM.endpoint and CRM.enabled in src/content/site.ts (or replace the fetch below with its SDK).
*/

export type Lead = {
  source: 'configurator' | 'mineral' | 'contact' | 'visit';
  locale: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  message?: string;
  /** free-form answers: configurator choices, units requested… */
  data?: Record<string, string | number | string[]>;
};

export type LeadResult = { ok: true; delivered: boolean } | { ok: false; error: 'network' };

export async function submitLead(lead: Lead): Promise<LeadResult> {
  if (!CRM.enabled || !CRM.endpoint) return { ok: true, delivered: false };
  try {
    const res = await fetch(CRM.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lead, page: location.pathname, at: new Date().toISOString() }),
    });
    return res.ok ? { ok: true, delivered: true } : { ok: false, error: 'network' };
  } catch {
    return { ok: false, error: 'network' };
  }
}
