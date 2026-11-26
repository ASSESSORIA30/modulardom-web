import type { MetadataRoute } from 'next';
import { env } from '@/server/env';

/** closed to crawlers everywhere except where SITE_INDEXABLE=true; the API is never crawled */
export default function robots(): MetadataRoute.Robots {
  if (!env.indexable) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/', disallow: '/api/' }, sitemap: `${env.siteUrl}/sitemap.xml` };
}
