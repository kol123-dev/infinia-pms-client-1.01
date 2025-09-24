/** @type {import('next').NextConfig} */
// Remove the Sentry import and wrapper
// import { withSentryConfig } from '@sentry/nextjs';
import withPWA from 'next-pwa';

// Update the withPWA invocation (no change to options)
const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
    ];
  },
  // Remove this invalid option
  // experimental: { trustHost: true },
};

// Change 'module.exports' to 'export default' and wrap with pwaConfig
// Export without Sentry
export default pwaConfig(nextConfig);
// Remove any withSentryConfig options or parameters
