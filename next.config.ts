import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Use Turbopack (default in Next.js 16)
  turbopack: {},

  // Stripe webhook requires raw body
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
