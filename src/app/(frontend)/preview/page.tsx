import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { loadTenantConfig } from '@/lib/tenant/loadTenantConfig'
import { DevPreviewRenderer } from '@/components/layouts/DevPreviewRenderer'
import type { Page, Tenant } from '@/payload-types'

type SearchParams = { id?: string; locale?: string }

export default async function PreviewPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  if (process.env.NODE_ENV === 'production') notFound()

  const { id, locale = 'en' } = await searchParams
  if (!id) notFound()

  const payload = await getPayloadClient()

  const page = await payload
    .findByID({
      collection: 'pages',
      id,
      locale: locale as 'de' | 'en' | 'vi',
      depth: 2,
      draft: true,
    })
    .catch(() => null)

  if (!page) notFound()

  const tenantSlug = (page.tenant as Tenant | null)?.slug ?? ''
  const config = loadTenantConfig(tenantSlug)
  if (!config) notFound()

  return <DevPreviewRenderer config={config} page={page as Page} locale={locale} />
}
