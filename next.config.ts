import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...(typeof config.resolve.alias === 'object' && !Array.isArray(config.resolve.alias)
        ? config.resolve.alias
        : {}),
      'components': path.resolve('./src/components'),
    }
    return config
  },
  // Images served from MinIO (S3-compatible)
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/media/**',
      },
    ],
  },
  // Redirect bare domain root to default locale (handled in middleware,
  // but keeping this as a fallback for static export scenarios)
  async redirects() {
    return []
  },
}

export default withPayload(nextConfig)
