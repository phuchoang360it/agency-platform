import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { resolveTenant } from '@/lib/tenant/resolveTenant'
import { isLocaleEnabled } from '@/lib/i18n/resolveLocale'
import { generateMetadata as buildMeta } from '@/lib/seo/generateMetadata'
import { getPayloadClient } from '@/lib/payload'
import { TenantPageRenderer } from '@/components/layouts/TenantPageRenderer'
import type { Page } from '@/payload-types'

// Dev-only preview route: /tenant/<domain>/<locale>/[[...slug]]
// This mirrors the main catch-all but reads the domain from the URL param
// (already injected as x-tenant-domain by middleware, but we also derive it here
// as a fallback for direct SSR without the rewrite).

type Params = {
  domain: string
  locale: string
  slug?: string[]
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  if (process.env.NODE_ENV === 'production') return {}
  const { domain, locale, slug = [] } = await params
  const config = resolveTenant(domain)
  if (!config || !isLocaleEnabled(config, locale)) return {}
  return buildMeta(config, locale, slug, {})
}

export default async function DevPreviewPage({ params }: { params: Promise<Params> }) {
  // Hard block in production — middleware already returns 404, but double-guard here.
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  const { domain, locale, slug = [] } = await params
  const config = resolveTenant(domain)

  if (!config) {
    notFound()
  }

  if (!isLocaleEnabled(config, locale)) {
    notFound()
  }

  const slugStr = slug.join('/') || 'home'

  const payload = await getPayloadClient()
  const tenantResult = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: config.slug } },
    limit: 1,
  })
  const tenantId = tenantResult.docs[0]?.id

  if (!tenantId) {
    // Tenant not seeded yet — show a helpful dev message
    return (
      <div className="p-8 font-mono text-sm">
        <h1 className="text-xl font-bold mb-4">Tenant not seeded</h1>
        <p>Run: <code className="bg-gray-100 px-2 py-1 rounded">pnpm tenant:seed {config.slug}</code></p>
      </div>
    )
  }

  const result = await payload.find({
    collection: 'pages',
    where: {
      and: [
        { slug: { equals: slugStr } },
        { tenant: { equals: tenantId } },
      ],
    },
    locale: locale as 'de' | 'en' | 'vi',
    depth: 2,
    limit: 1,
    draft: true,
  })

  const page = result.docs[0] as Page | undefined

  if (!page) {
    return (
      <div className="p-8 font-mono text-sm">
        <h1 className="text-xl font-bold mb-4">Page not found in DB</h1>
        <p>Tenant: {config.name} | Locale: {locale} | Slug: {slugStr}</p>
        <p className="mt-2">Run: <code className="bg-gray-100 px-2 py-1 rounded">pnpm tenant:seed {config.slug}</code></p>
      </div>
    )
  }

  // Gate on per-tenant enabled page types (e.g. 'blog' disabled for Acme).
  if (page.pageTemplate && !config.enabledPages.includes(page.pageTemplate)) {
    notFound()
  }

  return <TenantPageRenderer config={config} page={page} locale={locale} />
}
