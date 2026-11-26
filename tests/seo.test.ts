import { describe, expect, it } from 'vitest';
import { allPaths, isPublicIndexPage, pageMeta } from '@/lib/seo';
import { COMMERCIAL_KEYS, COMMERCIAL } from '@/content/commercial';
import { LOCALES, href, RESOURCE_KEYS, MENU } from '@/content/i18n';
import { LEGACY_REDIRECTS } from '@/content/legacy-redirects';

describe('SEO and migration', () => {
  it('includes useful commercial pages, their language counterparts and the configurator', () => {
    const paths = allPaths().map((entry) => entry.path);
    for (const lang of LOCALES) {
      for (const key of [...COMMERCIAL_KEYS, 'configurator', 'contact'] as const) {
        expect(paths).toContain(href(lang, key));
        expect(pageMeta(lang, key).alternates?.canonical).toBe(href(lang, key));
      }
      for (const key of COMMERCIAL_KEYS) expect(COMMERCIAL[lang][key].sections.length).toBeGreaterThan(1);
    }
    expect(new Set(paths).size).toBe(paths.length);
  });
  it('maps legacy pages to valid canonical pages without republishing old admin or demo access', () => {
    const paths = allPaths().map((p) => p.path);
    expect(new Set(LEGACY_REDIRECTS.map((r) => r.source)).size).toBe(LEGACY_REDIRECTS.length);
    for (const r of LEGACY_REDIRECTS) {
      expect(paths).toContain(r.destination);
      expect(r.source).not.toMatch(/admin|enviar\\.php/);
      expect(r.permanent).toBe(!r.source.startsWith('/acabados'));
    }
    for (const key of RESOURCE_KEYS) expect(MENU.some((n) => n.key === (key as string))).toBe(false);
  });
  it('does not index the private client page, and does not include incomplete content in the sitemap', () => {
    expect(isPublicIndexPage('clients')).toBe(false);
    expect(pageMeta('es', 'clients').robots).toEqual({ index: false, follow: true });
    expect(allPaths().every(({ key }) => isPublicIndexPage(key))).toBe(true);
  });
});
