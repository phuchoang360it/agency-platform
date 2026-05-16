import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { resolveTenant } from '@/lib/tenant/resolveTenant'
import { isLocaleEnabled } from '@/lib/i18n/resolveLocale'
import { getAllTenantConfigs } from '@/lib/tenant/loadTenantConfig'
import { generateMetadata as buildMeta } from '@/lib/seo/generateMetadata'
import { buildTag } from '@/lib/revalidation/tags'
import { getPayloadClient } from '@/lib/payload'
import { TenantPageRenderer } from '@/components/layouts/TenantPageRenderer'
import type { Page } from '@/payload-types'
import { unstable_cache } from 'next/cache'

type Params = {
  locale: string
  slug?: string[]
}

async function getPage(tenantId: string, slugStr: string, locale: string): Promise<Page | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'pages',
    where: {
      and: [
        { slug: { equals: slugStr } },
        { tenant: { equals: tenantId } },
        { _status: { equals: 'published' } },
      ],
    },
    locale: locale as 'de' | 'en' | 'vi',
    depth: 2,
    limit: 1,
  })
  return (result.docs[0] as Page) ?? null
}

async function getTenantIdBySlug(slug: string): Promise<string | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const tenant = result.docs[0]
  if (!tenant || tenant.active === false) return null
  return tenant.id != null ? String(tenant.id) : null
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug = [] } = await params
  const headersList = await headers()
  const tenantDomain = headersList.get('x-tenant-domain') ?? ''
  const config = resolveTenant(tenantDomain)
  if (!config || !isLocaleEnabled(config, locale)) return {}

  const slugStr = slug.join('/') || 'home'
  const tenantId = await getTenantIdBySlug(config.slug)
  const page = tenantId ? await getPage(tenantId, slugStr, locale) : null

  return buildMeta(config, locale, slug, {
    title: page?.meta?.title ?? page?.title ?? null,
    description: page?.meta?.description ?? null,
    ogImageUrl: null,
  })
}

export default async function TenantPage({ params }: { params: Promise<Params> }) {
  const { locale, slug = [] } = await params
  const headersList = await headers()
  const tenantDomain = headersList.get('x-tenant-domain') ?? ''

  const config = resolveTenant(tenantDomain)

  if (!config) {
    // No tenant matched — render "no tenants" only at root; 404 everywhere else
    if (slug.length === 0) notFound()
    notFound()
  }

  if (!isLocaleEnabled(config, locale)) {
    notFound()
  }

  const slugStr = slug.join('/') || 'home'
  const tenantId = await getTenantIdBySlug(config.slug)

  if (!tenantId) {
    notFound()
  }

  // Tag this response for surgical revalidation.
  const cacheTag = buildTag(config.slug, locale, slugStr)
  const getCachedPage = unstable_cache(
    () => getPage(tenantId, slugStr, locale),
    [cacheTag],
    { tags: [cacheTag, buildTag(config.slug)] },
  )

  const page = await getCachedPage()

  if (!page) {
    notFound()
  }

  // Gate on per-tenant enabled page types (e.g. 'blog' disabled for Acme).
  if (page.pageTemplate && !config.enabledPages.includes(page.pageTemplate)) {
    notFound()
  }

  return (
    <TenantPageRenderer config={config} page={page} locale={locale} />
  )
}

// Pre-generate all (tenant × locale × slug) combinations at build time.
export async function generateStaticParams(): Promise<Array<{ locale: string; slug: string[] }>> {
  const configs = getAllTenantConfigs()
  const params: Array<{ locale: string; slug: string[] }> = []

  try {
    const payload = await getPayloadClient()

    for (const config of configs) {
      const tenantResult = await payload.find({
        collection: 'tenants',
        where: { slug: { equals: config.slug } },
        limit: 1,
      })
      const tenantDoc = tenantResult.docs[0]
      if (!tenantDoc?.id || tenantDoc.active === false) continue
      const tenantId = tenantDoc.id

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
          limit: 200,
        })

        for (const page of pages.docs as Page[]) {
          params.push({
            locale,
            slug: page.slug === 'home' ? [] : [page.slug],
          })
        }
      }
    }
  } catch {
    // DB not available at build time — fall back to empty (pages rendered on demand).
  }

  return params
}
