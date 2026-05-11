import type { TenantConfig } from './types'
import { ALL_TENANT_CONFIGS } from '@/tenants/registry'

// Build domain → config map once. Works in both Node.js and Edge runtimes
// because it only uses static imports (no fs, no async I/O).
const domainMap = new Map<string, TenantConfig>()

for (const config of ALL_TENANT_CONFIGS) {
  for (const domain of config.domains) {
    const normalised = normaliseDomain(domain)
    domainMap.set(normalised, config)
  }
}

// Strip www. prefix and port number for lookup normalisation.
function normaliseDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/:\d+$/, '')
}

/**
 * Resolve a raw `Host` header value (or extracted domain string) to a tenant config.
 *
 * Tries the exact value first, then www-stripped / port-stripped variants.
 * Returns null if no tenant matches (caller should render 404 or "no tenants" page).
 */
export function resolveTenant(host: string): TenantConfig | null {
  // Try exact match first (handles custom ports in dev: __fixture__.test:3000)
  if (domainMap.has(host.toLowerCase())) return domainMap.get(host.toLowerCase())!

  // Try normalised (strip www / port)
  const normalised = normaliseDomain(host)
  return domainMap.get(normalised) ?? null
}

/**
 * Parse a dev-preview path prefix and return the embedded domain.
 *
 * Input:  `/tenant/__fixture__.test/en/about`
 * Output: `__fixture__.test`  (the rest of the path is `/en/about`)
 *
 * Returns null if the path does not start with `/tenant/`.
 */
export function extractDevPreviewDomain(pathname: string): string | null {
  const match = pathname.match(/^\/tenant\/([^/]+)(\/.*)?$/)
  return match ? match[1] : null
}
