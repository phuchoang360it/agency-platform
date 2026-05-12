import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { resolveTenant } from '@/lib/tenant/resolveTenant'
import { getPayloadClient } from '@/lib/payload'
import type { Page } from '@/payload-types'

export async function GET(): Promise<NextResponse> {
  const headersList = await headers()
  const tenantDomain = headersList.get('x-tenant-domain') ?? ''
  const config = resolveTenant(tenantDomain)

  if (!config) {
    return new NextResponse('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>', {
      headers: { 'Content-Type': 'application/xml' },
    })
  }

  const baseUrl = `https://${config.domains[0]}`
  const payload = await getPayloadClient()

  const tenantResult = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: config.slug } },
    limit: 1,
  })
  const tenantId = tenantResult.docs[0]?.id

  const urls: string[] = []

  if (tenantId) {
    for (const locale of config.locales.enabled) {
      const pages = await payload.find({
        collection: 'pages',
        where: {
          and: [
            { tenant: { equals: tenantId } },
            { _status: { equals: 'published' } },
          ],
        },
        locale: locale as 'de' | 'en' | 'vi',
        limit: 1000,
      })

      for (const page of pages.docs as Page[]) {
        const slugPath = page.slug === 'home' ? '' : `/${page.slug}`
        urls.push(
          `<url><loc>${baseUrl}/${locale}${slugPath}</loc><changefreq>weekly</changefreq></url>`,
        )
      }
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml' },
  })
}
