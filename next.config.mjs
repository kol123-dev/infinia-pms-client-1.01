import withPWAInit from '@ducanh2912/next-pwa'
import path from 'path'

const isDev = process.env.NODE_ENV === 'development'
const isProd = process.env.NODE_ENV === 'production'

// Initialize the PWA plugin (disabled in dev)
const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NEXT_ENABLE_PWA === '1' ? false : true,
  runtimeCaching: [
    {
      urlPattern: /^\/_next\/static\/.*$/,
      handler: 'CacheFirst',
      options: { cacheName: 'next-static', expiration: { maxEntries: 256, maxAgeSeconds: 31536000 } },
    },
    {
      urlPattern: /^\/_next\/data\/.*$/,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'next-data', expiration: { maxEntries: 128, maxAgeSeconds: 86400 } },
    },
    {
      urlPattern: /^https?:\/\/.*\/api\/v1\/.*$/,
      handler: 'NetworkFirst',
      options: { cacheName: 'api', networkTimeoutSeconds: 10, expiration: { maxEntries: 64, maxAgeSeconds: 86400 } },
    },
  ],
  buildExcludes: [/middleware-manifest\.json$/],
})

// Next.js config
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Make dev smoother; full optimization in production
    unoptimized: !isProd,
    formats: ['image/avif', 'image/webp'],
    // Allow common external hosts you’re using
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8000' }, // e.g., Django media
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    // Optional if you render SVGs via <Image />
    // dangerouslyAllowSVG: true,
    // contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Move these inside the config object
  typescript: {
    ignoreBuildErrors: true,
  },

  onDemandEntries: {
    maxInactiveAge: 120000,
    pagesBufferLength: 5,
  },

  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://194.163.148.34:8000/api/v1/:path*',
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}
export default withPWA(nextConfig)
