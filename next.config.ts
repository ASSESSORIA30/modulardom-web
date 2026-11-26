import type { NextConfig } from 'next';
import { LEGACY_REDIRECTS } from './src/content/legacy-redirects';

/*
  Pages with their own file live under app/[lang]/<catalan-slug>/. Their Spanish addresses are
  rewritten onto them, and the Catalan slug under /es redirects to the Spanish one, so each
  language has one descriptive URL per page.
*/
const ES_SLUGS: Record<string, string> = { projectes: 'proyectos', contacte: 'contacto' };

const security = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const config: NextConfig = {
  // the dossier embeds the logo: make sure the file travels with that function
  outputFileTracingIncludes: { '/api/dossier': ['./public/brand/modulardom-200.png'] },
  async redirects() {
    return [
      { source: '/', destination: '/ca', permanent: false },
      ...LEGACY_REDIRECTS,
      // Preserve links to the existing standalone Spanish budget and static entry points.
      { source: '/presupuesto', destination: '/es/configurador', permanent: true },
      { source: '/presupuesto/index.html', destination: '/es/configurador', permanent: true },
      { source: '/index.html', destination: '/ca', permanent: true },
      { source: '/es/presupuesto', destination: '/es/configurador', permanent: true },
      { source: '/ca/pressupost', destination: '/ca/configurador', permanent: true },
      ...Object.entries(ES_SLUGS).map(([ca, es]) => ({ source: `/es/${ca}`, destination: `/es/${es}`, permanent: true })),
    ];
  },
  async rewrites() {
    return Object.entries(ES_SLUGS).map(([ca, es]) => ({ source: `/es/${es}`, destination: `/es/${ca}` }));
  },
  async headers() {
    return [
      { source: '/:path*', headers: security },
      // Defense in depth: never index previews, even if a project-level flag is set by mistake.
      ...(process.env.VERCEL_ENV !== 'production' || !['true', '1'].includes(process.env.SITE_INDEXABLE ?? '')
        ? [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }]
        : []),
      {
        // Tour frames and stills are addressed with ?v=<version>; bump it when they are rebuilt.
        source: '/:dir(tour|stills)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default config;
