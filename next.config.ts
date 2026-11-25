import type { NextConfig } from 'next';

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
      ...Object.entries(ES_SLUGS).map(([ca, es]) => ({ source: `/es/${ca}`, destination: `/es/${es}`, permanent: true })),
    ];
  },
  async rewrites() {
    return Object.entries(ES_SLUGS).map(([ca, es]) => ({ source: `/es/${es}`, destination: `/es/${ca}` }));
  },
  async headers() {
    return [
      { source: '/:path*', headers: security },
      {
        // Tour frames and stills are addressed with ?v=<version>; bump it when they are rebuilt.
        source: '/:dir(tour|stills)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default config;
