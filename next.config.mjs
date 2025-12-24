import withPWAInit from '@ducanh2912/next-pwa'
import path from 'path'

const isDev = process.env.NODE_ENV === 'development'
const isProd = process.env.NODE_ENV === 'production'

// Initialize the PWA plugin (disabled in dev)
const enablePwa = process.env.NEXT_ENABLE_PWA
  ? process.env.NEXT_ENABLE_PWA === '1'
  : isProd

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: !enablePwa,
  fallbacks: {
    document: '/dashboard',
  },
  runtimeCaching: [
    {
      urlPattern: /^\/_next\/static\/.*$/,
      handler: 'CacheFirst',
      options: { cacheName: 'next-static', expiration: { maxEntries: 256, maxAgeSeconds: 31536000 } },
    },
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'pages',
        expiration: { maxEntries: 64, maxAgeSeconds: 86400 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /^\/_next\/data\/.*$/,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'next-data', expiration: { maxEntries: 128, maxAgeSeconds: 86400 } },
    },
    {
      urlPattern: /^\/_next\/image\?.*$/,
      handler: 'CacheFirst',
      options: { cacheName: 'next-image', expiration: { maxEntries: 256, maxAgeSeconds: 2592000 }, cacheableResponse: { statuses: [0, 200] } },
    },
    {
      urlPattern: ({ request }) => request.destination === 'image',
      handler: 'CacheFirst',
      options: { cacheName: 'images', expiration: { maxEntries: 256, maxAgeSeconds: 2592000 }, cacheableResponse: { statuses: [0, 200] } },
    },
    {
      urlPattern: ({ request }) => request.destination === 'font',
      handler: 'CacheFirst',
      options: { cacheName: 'fonts', expiration: { maxEntries: 64, maxAgeSeconds: 31536000 }, cacheableResponse: { statuses: [0, 200] } },
    },
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'google-fonts-styles', expiration: { maxEntries: 16, maxAgeSeconds: 86400 }, cacheableResponse: { statuses: [0, 200] } },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: { cacheName: 'google-fonts-webfonts', expiration: { maxEntries: 32, maxAgeSeconds: 31536000 }, cacheableResponse: { statuses: [0, 200] } },
    },
    {
      urlPattern: ({ url }) => url.pathname.startsWith('/api/v1/'),
      handler: 'StaleWhileRevalidate',
      method: 'GET',
      options: { cacheName: 'api-get', expiration: { maxEntries: 256, maxAgeSeconds: 86400 }, cacheableResponse: { statuses: [0, 200] } },
    },
    {
      urlPattern: ({ url }) => url.pathname.startsWith('/api/v1/'),
      handler: 'NetworkOnly',
      method: 'POST',
      options: { backgroundSync: { name: 'api-mutation-queue', options: { maxRetentionTime: 1440 } } },
    },
    {
      urlPattern: ({ url }) => url.pathname.startsWith('/api/v1/'),
      handler: 'NetworkOnly',
      method: 'PUT',
      options: { backgroundSync: { name: 'api-mutation-queue', options: { maxRetentionTime: 1440 } } },
    },
    {
      urlPattern: ({ url }) => url.pathname.startsWith('/api/v1/'),
      handler: 'NetworkOnly',
      method: 'PATCH',
      options: { backgroundSync: { name: 'api-mutation-queue', options: { maxRetentionTime: 1440 } } },
    },
    {
      urlPattern: ({ url }) => url.pathname.startsWith('/api/v1/'),
      handler: 'NetworkOnly',
      method: 'DELETE',
      options: { backgroundSync: { name: 'api-mutation-queue', options: { maxRetentionTime: 1440 } } },
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
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/icons/favicon.ico',
      },
    ]
  },
}
export default withPWA(nextConfig)
