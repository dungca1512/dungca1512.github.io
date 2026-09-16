import type { NextConfig } from 'next';

/* GitHub Pages serves a directory of files and nothing else. `output: 'export'`
   turns every server-only feature into a build error at the moment it is
   written, which is the point of setting it now rather than at deploy time.
   `trailingSlash` makes /vi/ a real directory with an index.html, so Pages can
   serve it without a rewrite rule we have no way to install.

   In dev only, / redirects to /vi/. In production that hop is public/index.html
   instead, because a static host cannot issue a 3xx. */
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  ...(process.env.NODE_ENV === 'development'
    ? { redirects: async () => [{ source: '/', destination: '/vi/', permanent: false }] }
    : {}),
};

export default nextConfig;
