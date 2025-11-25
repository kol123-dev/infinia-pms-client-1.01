import withPWA from 'next-pwa'

const isDev = process.env.NODE_ENV === 'development'
const isProd = process.env.NODE_ENV === 'production'

// Initialize the PWA plugin (disabled in dev)
const withPWAFn = withPWA({
  dest: 'public',
  disable: process.env.NEXT_ENABLE_PWA === '1' ? false : true,
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
  eslint: {
    ignoreDuringBuilds: true,
  },
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
}
export default withPWAFn(nextConfig)
