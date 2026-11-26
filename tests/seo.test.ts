import { describe, expect, it } from 'vitest';
import { allPaths, isPublicIndexPage, pageMeta } from '@/lib/seo';
import { COMMERCIAL_KEYS, COMMERCIAL } from '@/content/commercial';
import { LOCALES, href } from '@/content/i18n';

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
  it('does not index the private client page, and does not include incomplete content in the sitemap', () => {
    expect(isPublicIndexPage('clients')).toBe(false);
    expect(pageMeta('es', 'clients').robots).toEqual({ index: false, follow: true });
    expect(allPaths().every(({ key }) => isPublicIndexPage(key))).toBe(true);
  });
});
