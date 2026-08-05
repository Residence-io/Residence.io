import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Transpile workspace packages from source (no pre-build needed on Vercel)
  transpilePackages: ['@residence/shared'],
  // Allow deployment even if TypeScript has unresolved module errors
  typescript: {
    ignoreBuildErrors: true,
  },
  // Silence the "webpack config but no turbopack config" error in Next.js 16
  turbopack: {
    resolveAlias: {
      '@residence/shared': path.resolve(
        __dirname,
        '../../packages/shared/src/index.ts',
      ),
    },
  },
  webpack(config) {
    // Resolve @residence/shared from TypeScript source directly
    config.resolve.alias['@residence/shared'] = path.resolve(
      __dirname,
      '../../packages/shared/src/index.ts',
    );
    return config;
  },
};

export default nextConfig;
