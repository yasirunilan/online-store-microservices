import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@online-store/shared-types'],
};

export default nextConfig;
