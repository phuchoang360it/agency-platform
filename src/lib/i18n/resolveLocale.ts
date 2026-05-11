import type { TenantConfig, SupportedLocale } from '@/lib/tenant/types'
import { isSupportedLocale } from './locales'

/**
 * Check whether a locale string is enabled for the given tenant.
 * Returns false for unsupported platform locales and tenant-disabled locales.
 */
export function isLocaleEnabled(config: TenantConfig, locale: string): locale is SupportedLocale {
  if (!isSupportedLocale(locale)) return false
  return config.locales.enabled.includes(locale)
}

/**
 * Resolve the best locale for a request.
 *
 * Priority:
 *   1. `requested` if it is enabled for this tenant
 *   2. Tenant's default locale as fallback
 *
 * Never returns a locale outside the tenant's enabled set.
 */
export function resolveLocale(
  config: TenantConfig,
  requested: string | undefined,
): SupportedLocale {
  if (requested && isLocaleEnabled(config, requested)) {
    return requested
  }
  return config.locales.default
}
