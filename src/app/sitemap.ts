import type { MetadataRoute } from 'next';
import { LOCALES, href } from '@/content/i18n';
import { allPaths } from '@/lib/seo';
import { env } from '@/server/env';

/** every page in both languages, each pointing at its counterpart */
export default function sitemap(): MetadataRoute.Sitemap {
  return allPaths().map(({ path, key }) => ({
    url: env.siteUrl + path,
    changeFrequency: key ? 'monthly' : 'weekly',
    priority: key ? 0.6 : 1,
    alternates: { languages: { ...Object.fromEntries(LOCALES.map((l) => [l, env.siteUrl + (key ? href(l, key) : `/${l}`)])), 'x-default': env.siteUrl + (key ? href('ca', key) : '/ca') } },
  }));
}
