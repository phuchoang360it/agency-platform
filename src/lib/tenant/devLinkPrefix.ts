import type { TenantConfig } from './types'

export function devLinkPrefix(config: TenantConfig): string {
  if (process.env.NODE_ENV === 'production') return ''
  return `/tenant/${config.domains[0]}`
}
