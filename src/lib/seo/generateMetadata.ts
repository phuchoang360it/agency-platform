import type { Metadata } from 'next'
import type { TenantConfig } from '@/lib/tenant/types'
import { buildHreflang } from './hreflang'

type PageMeta = {
  title?: string | null
  description?: string | null
  ogImageUrl?: string | null
}

export function generateMetadata(
  config: TenantConfig,
  locale: string,
  slug: string[],
  page?: PageMeta,
): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
  const path = slug.length ? '/' + slug.join('/') : ''
  const canonical = `${baseUrl}/${locale}${path}`

  const hreflang = buildHreflang(config, baseUrl, slug)

  return {
    title: page?.title ?? config.name,
    description: page?.description ?? undefined,
    alternates: {
      canonical,
      languages: Object.fromEntries(hreflang.map((h) => [h.hreflang, h.href])),
    },
    openGraph: {
      title: page?.title ?? config.name,
      description: page?.description ?? undefined,
      url: canonical,
      siteName: config.name,
      images: page?.ogImageUrl ? [{ url: page.ogImageUrl }] : undefined,
      locale,
    },
  }
}
