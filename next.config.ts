import type { NextConfig } from 'next';

const config: NextConfig = {
  async redirects() {
    return [{ source: '/', destination: '/ca', permanent: false }];
  },
  async headers() {
    return [
      {
        // Tour frames and stills are addressed with ?v=<version>; bump it when frames are rebuilt.
        source: '/:dir(tour|stills)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default config;
