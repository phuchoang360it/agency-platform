#!/usr/bin/env tsx
/**
 * Tenant seed script.
 *
 * Usage: pnpm tenant:seed <slug>
 *
 * 1. Loads src/tenants/<slug>/tenant.config.ts and validates with Zod.
 * 2. Loads src/tenants/<slug>/seed.ts and calls seed(payload, config).
 * 3. Upserts the tenant document in Payload.
 * 4. The seed function imports placeholder pages/blocks.
 *
 * Idempotent: re-running updates rather than duplicates.
 */

import path from 'path'
import { getPayload } from 'payload'
import { TenantConfigSchema, type TenantConfig } from '../src/lib/tenant/types'

const slug = process.argv[2]

if (!slug) {
  console.error('Usage: pnpm tenant:seed <slug>')
  process.exit(1)
}

async function main() {
  const tenantDir = path.resolve(process.cwd(), 'src', 'tenants', slug)

  // Load and validate the tenant config
  const configModule = await import(path.join(tenantDir, 'tenant.config.ts'))
  const rawConfig = configModule.default
  const config = TenantConfigSchema.parse(rawConfig)

  // Load the seed function
  const seedModule = await import(path.join(tenantDir, 'seed.ts'))
  const { seed } = seedModule as { seed: (payload: Awaited<ReturnType<typeof getPayload>>, config: TenantConfig) => Promise<void> }

  if (typeof seed !== 'function') {
    console.error(`src/tenants/${slug}/seed.ts must export a named "seed" function.`)
    process.exit(1)
  }

  // Initialise Payload (connects to DB)
  const payloadConfig = await import('../src/payload.config')
  const payload = await getPayload({ config: payloadConfig.default })

  await seed(payload, config)

  console.log(`✅ Seed complete for tenant: ${slug}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
