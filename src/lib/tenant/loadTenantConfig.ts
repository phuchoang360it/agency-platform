import type { TenantConfig } from './types'
import { ALL_TENANT_CONFIGS } from '@/tenants/registry'

// In-memory cache keyed by tenant slug. Populated once at module load.
// Re-adding a tenant requires a process restart (acceptable: config is code).
const cache = new Map<string, TenantConfig>(
  ALL_TENANT_CONFIGS.map((cfg) => [cfg.slug, cfg]),
)

export function loadTenantConfig(slug: string): TenantConfig | null {
  return cache.get(slug) ?? null
}

export function getAllTenantConfigs(): TenantConfig[] {
  return Array.from(cache.values())
}
