import { PRIVACY_POLICY } from '@/content/site';
/*
  Everything the server needs from its environment, read in one place. None of it reaches the
  browser: no variable here starts with NEXT_PUBLIC_, and this file is only imported from
  src/server and src/app/api.

  All integrations are OFF unless their variables are set (see docs/operations.md).
*/
const on = (v: string | undefined) => v === 'true' || v === '1';

export const env = {
  /** ModularDom CRM's published tariff, e.g. https://<crm>/api/configurador/tarifa (JSON) */
  tariffUrl: process.env.CRM_TARIFF_URL || null,
  /** show indicative prices to visitors: needs a tariff AND this explicit switch */
  pricingPublic: on(process.env.PRICING_PUBLIC),
  /** where leads are delivered, and the shared secret that signs them */
  leadUrl: process.env.CRM_LEAD_URL || null,
  leadSecret: process.env.CRM_LEAD_SECRET || null,
  leadsEnabled: on(process.env.CRM_LEADS_ENABLED),
  crmProtectionBypass: process.env.CRM_PROTECTION_BYPASS || null,
  /** bearer token for /api/admin/*; without it those routes do not exist */
  adminToken: process.env.ADMIN_TOKEN || null,
  siteUrl: (process.env.SITE_URL || (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')).replace(/\/$/, ''),
  /** search engines may index the site: off on every preview */
  indexable: process.env.VERCEL_ENV === 'production' && on(process.env.SITE_INDEXABLE),
};

/** personal data is only collected in production once the privacy policy is published */
export const privacyGate = (vercelEnv = process.env.VERCEL_ENV, published = PRIVACY_POLICY.published) => published || vercelEnv !== 'production';
export const leadsLive = () => env.leadsEnabled && !!env.leadUrl && !!env.leadSecret && privacyGate();
