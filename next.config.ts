import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // pdf-parse uses CommonJS dynamic requires that must run as an external
  // server-side package rather than being bundled.
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
