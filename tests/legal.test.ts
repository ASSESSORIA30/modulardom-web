import { describe, expect, it } from 'vitest';
import { LEGAL_KEYS, LOCALES, MENU, NAV, dictionaries, href } from '@/content/i18n';
import { LEGAL_CONTENT } from '@/content/legal';

describe('localised legal information', () => {
  it('has a route, translation, metadata and content for each legal page in both languages', () => {
    for (const lang of LOCALES) {
      for (const key of LEGAL_KEYS) {
        expect(href(lang, key)).toMatch(new RegExp('^/' + lang + '/'));
        expect(NAV.some((n) => n.key === key)).toBe(true);
        expect(dictionaries[lang].nav[key]).toBeTruthy();
        expect(dictionaries[lang].seo[key]).toBeTruthy();
        expect(LEGAL_CONTENT[lang][key].sections.length).toBeGreaterThan(1);
      }
    }
    expect(MENU.some((n) => (LEGAL_KEYS as readonly string[]).includes(n.key))).toBe(false);
  });
});
