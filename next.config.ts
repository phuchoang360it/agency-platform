import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
