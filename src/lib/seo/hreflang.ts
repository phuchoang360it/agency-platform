import type { TenantConfig } from '@/lib/tenant/types'

export type HreflangEntry = {
  hreflang: string
  href: string
}

/**
 * Build hreflang link entries for the given page across all enabled locales.
 * Only emits locales that are enabled for the tenant (never all platform locales).
 */
export function buildHreflang(
  config: TenantConfig,
  baseUrl: string,
  slug: string[],
): HreflangEntry[] {
  const path = slug.length ? '/' + slug.join('/') : ''
  return config.locales.enabled.map((locale) => ({
    hreflang: locale,
    href: `${baseUrl}/${locale}${path}`,
  }))
}
