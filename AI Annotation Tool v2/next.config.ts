import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Mark better-sqlite3 as server-side external package
  serverExternalPackages: ['better-sqlite3'],

  // Configure allowed image domains for Next.js Image component
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/cross-platform-assignmen-b97cc.firebasestorage.app/**',
      },
    ],
  },

  // Configure webpack to handle better-sqlite3 and other native modules
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle native modules for server-side rendering
      config.externals = config.externals || [];
      config.externals.push({
        'better-sqlite3': 'commonjs better-sqlite3',
      });
    }

    return config;
  },
};

export default nextConfig;
