import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { resolveTenant } from '@/lib/tenant/resolveTenant'

export async function GET(): Promise<NextResponse> {
  const headersList = await headers()
  const tenantDomain = headersList.get('x-tenant-domain') ?? ''
  const config = resolveTenant(tenantDomain)

  const baseUrl = config
    ? `https://${config.domains[0]}`
    : process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'

  const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`

  return new NextResponse(robots, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
