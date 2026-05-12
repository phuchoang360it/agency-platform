import type { TenantConfig } from '@/lib/tenant/types'
import { TenantConfigSchema } from '@/lib/tenant/types'

// ── Tenant registry ──────────────────────────────────────────────────────────
//
// ADD NEW TENANTS BELOW this comment. Import the config and append to the array.
// The seed script (pnpm tenant:seed <slug>) will update this file automatically.
//
// IMPORTANT: This file is imported by middleware (Edge runtime).
// Do not import Node.js-only modules here.

import fixtureConfig from './__fixture__/tenant.config'
import acmeConfig from './acme/tenant.config'

const rawConfigs: TenantConfig[] = [
  fixtureConfig,
  acmeConfig,
]

// Validate every config at module-load time. A bad config throws immediately
// (app startup failure) rather than silently serving wrong data at runtime.
export const ALL_TENANT_CONFIGS: TenantConfig[] = rawConfigs.map((cfg) =>
  TenantConfigSchema.parse(cfg),
)
