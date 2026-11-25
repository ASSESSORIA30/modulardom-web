import type { NextConfig } from 'next';

const config: NextConfig = {
  async redirects() {
    return [{ source: '/', destination: '/ca', permanent: false }];
  },
  async headers() {
    return [
      {
        // Frame files are addressed with ?v=<FRAMES_VERSION>; bump it when frames are rebuilt.
        source: '/frames/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default config;
