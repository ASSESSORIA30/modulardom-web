import type { Metadata } from 'next';
import { LOCALES, NAV, dictionaries, href, type Locale, type NavKey } from '@/content/i18n';
import { COMPANY, PRIVACY_POLICY } from '@/content/site';
import { PROJECTS } from '@/content/projects';
import { MINERAL_MODELS } from '@/content/mineral';
import { COMMERCIAL, isCommercialPage } from '@/content/commercial';

/** Only substantial, public pages belong in the index. Draft legal pages and private access stay out. */
export function isPublicIndexPage(key: NavKey | null): boolean {
  if (key === 'clients') return false;
  if (key === 'projects') return PROJECTS.length > 0;
  if (key === 'mineral') return MINERAL_MODELS.length > 0;
  if (key === 'privacy' || key === 'legal' || key === 'cookies') return PRIVACY_POLICY.published;
  return true;
}

/** title, description, canonical and the same page in the other language, for one page of the menu */
export function pageMeta(lang: Locale, key: NavKey): Metadata {
  const dict = dictionaries[lang];
  const title = isCommercialPage(key) ? `${COMMERCIAL[lang][key].seoTitle} · ModularDom` : key === 'configurator' ? (lang === 'ca' ? 'Calcula el pressupost de la teva casa · ModularDom' : 'Calcula el presupuesto de tu casa · ModularDom') : `${dict.nav[key]} · ModularDom`;
  const description = dict.seo[key];
  return {
    title,
    description,
    ...(!isPublicIndexPage(key) ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical: href(lang, key),
      languages: { ...Object.fromEntries(LOCALES.map((l) => [l, href(l, key)])), 'x-default': href('ca', key) },
    },
    openGraph: { title, description, url: href(lang, key), locale: lang === 'ca' ? 'ca_ES' : 'es_ES', siteName: 'ModularDom', type: 'website' },
  };
}

/** Canonical public addresses only; drafts, private access and empty catalogues are excluded. */
export const allPaths = () => LOCALES.flatMap((l) => [{ lang: l, path: `/${l}`, key: null as NavKey | null }, ...NAV.filter((n) => isPublicIndexPage(n.key)).map((n) => ({ lang: l, path: href(l, n.key), key: n.key as NavKey | null }))]);

/**
 * Structured data: the company, with only what ModularDom itself publishes (legal name, tax id,
 * e-mail, phone, province). No ratings, prices, certifications or opening hours are stated.
 */
export const organizationJsonLd = (siteUrl: string, lang: Locale) => ({
  '@context': 'https://schema.org',
  '@type': 'HomeAndConstructionBusiness',
  name: 'ModularDom',
  legalName: COMPANY.legalName,
  taxID: COMPANY.taxId,
  url: `${siteUrl}/${lang}`,
  logo: `${siteUrl}/brand/modulardom-200.png`,
  email: COMPANY.email,
  telephone: COMPANY.phone,
  address: { '@type': 'PostalAddress', addressRegion: COMPANY.region, addressCountry: 'ES' },
  areaServed: 'ES',
  inLanguage: lang,
});
