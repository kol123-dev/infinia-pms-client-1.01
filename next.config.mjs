import withPWA from 'next-pwa'

const isDev = process.env.NODE_ENV === 'development'
const isProd = process.env.NODE_ENV === 'production'

// Initialize the PWA plugin (disabled in dev)
const withPWAFn = withPWA({
  dest: 'public',
  disable: isDev,
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

  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
    ]
  },

  // experimental: { trustHost: true }, // if you need it, ensure it’s valid for your Next version
}

// Change 'module.exports' to 'export default' and wrap with pwaConfig
// Export without Sentry
export default withPWAFn(nextConfig)
