import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Image Optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Font Optimization
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
  
  // Caching Strategy
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:hash*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Bundle Optimization
  webpack: (config, { isServer }) => {
    // Tree shaking for Lodash
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: false, // Disable to fix cacheUnaffected conflict
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              chunks: 'initial',
            },
            common: {
              minChunks: 2,
              priority: -20,
              chunks: 'all',
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    // Fix for Next.js 15 + Webpack 5 cache conflict
    if (config.optimization) {
      config.optimization.usedExports = false;
    }
    
    return config;
  },
  
  // Vercel: no standalone (better asset serving). Docker: use standalone.
  ...(process.env.VERCEL
    ? {}
    : { output: "standalone" as const, outputFileTracingRoot: path.resolve(process.cwd()) }),
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "",
  project: process.env.SENTRY_PROJECT || "",
  silent: !process.env.CI,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Additional Sentry options for better performance
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  disableServerWebpackPlugin: !!process.env.SENTRY_DISABLE_SERVER_WEBPACK_PLUGIN,
  disableClientWebpackPlugin: !!process.env.SENTRY_DISABLE_CLIENT_WEBPACK_PLUGIN,
});
