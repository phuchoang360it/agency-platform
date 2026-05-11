import { describe, it, expect, vi } from 'vitest'
import { TenantConfigSchema } from '@/lib/tenant/types'
import { ZodError } from 'zod'

vi.mock('@/tenants/registry', () => ({
  ALL_TENANT_CONFIGS: [
    {
      slug: 'acme',
      name: 'Acme Corp',
      domains: ['acme.com'],
      locales: { enabled: ['en'], default: 'en', omitDefaultPrefix: false },
      enabledPages: ['home'],
    },
  ],
}))

import { loadTenantConfig, getAllTenantConfigs } from '@/lib/tenant/loadTenantConfig'

describe('loadTenantConfig', () => {
  it('returns config for known slug', () => {
    const config = loadTenantConfig('acme')
    expect(config?.slug).toBe('acme')
    expect(config?.name).toBe('Acme Corp')
  })

  it('returns null for unknown slug', () => {
    expect(loadTenantConfig('nonexistent')).toBeNull()
  })
})

describe('getAllTenantConfigs', () => {
  it('returns all registered configs', () => {
    const all = getAllTenantConfigs()
    expect(all.length).toBeGreaterThan(0)
  })
})

describe('TenantConfigSchema', () => {
  it('accepts a valid config', () => {
    const result = TenantConfigSchema.safeParse({
      slug: 'acme',
      name: 'Acme',
      domains: ['acme.com'],
      locales: { enabled: ['en', 'de'], default: 'en' },
      enabledPages: ['home', 'about'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid slug with uppercase', () => {
    const result = TenantConfigSchema.safeParse({
      slug: 'ACME',
      name: 'Acme',
      domains: ['acme.com'],
      locales: { enabled: ['en'], default: 'en' },
      enabledPages: ['home'],
    })
    expect(result.success).toBe(false)
  })

  it('rejects default locale not in enabled list', () => {
    const result = TenantConfigSchema.safeParse({
      slug: 'acme',
      name: 'Acme',
      domains: ['acme.com'],
      locales: { enabled: ['en'], default: 'de' },
      enabledPages: ['home'],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ZodError)
    }
  })

  it('rejects unsupported locale', () => {
    const result = TenantConfigSchema.safeParse({
      slug: 'acme',
      name: 'Acme',
      domains: ['acme.com'],
      locales: { enabled: ['fr'], default: 'fr' },
      enabledPages: ['home'],
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty domains', () => {
    const result = TenantConfigSchema.safeParse({
      slug: 'acme',
      name: 'Acme',
      domains: [],
      locales: { enabled: ['en'], default: 'en' },
      enabledPages: ['home'],
    })
    expect(result.success).toBe(false)
  })
})
