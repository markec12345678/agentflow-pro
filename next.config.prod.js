/**
 * Next.js Config - Production Build
 * Disable problematic features for simpler build
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable experimental features that cause build issues
  experimental: {
    // Keep only essential experiments
  },
  
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Ignore ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Reduce build output
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Reduce bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
