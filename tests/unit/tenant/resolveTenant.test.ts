import { describe, it, expect, vi } from 'vitest'

// Mock the registry so tests don't depend on real tenant configs
vi.mock('@/tenants/registry', () => ({
  ALL_TENANT_CONFIGS: [
    {
      slug: 'acme',
      name: 'Acme',
      domains: ['acme.com', 'www.acme.com'],
      locales: { enabled: ['en', 'de'], default: 'en', omitDefaultPrefix: false },
      enabledPages: ['home'],
    },
    {
      slug: 'demo',
      name: 'Demo',
      domains: ['demo.de'],
      locales: { enabled: ['de'], default: 'de', omitDefaultPrefix: false },
      enabledPages: ['home'],
    },
  ],
}))

import { resolveTenant, extractDevPreviewDomain } from '@/lib/tenant/resolveTenant'

describe('resolveTenant', () => {
  it('resolves exact domain', () => {
    const result = resolveTenant('acme.com')
    expect(result?.slug).toBe('acme')
  })

  it('resolves www-prefixed domain', () => {
    const result = resolveTenant('www.acme.com')
    expect(result?.slug).toBe('acme')
  })

  it('strips port from host', () => {
    const result = resolveTenant('acme.com:3000')
    expect(result?.slug).toBe('acme')
  })

  it('returns null for unknown domain', () => {
    expect(resolveTenant('unknown.example')).toBeNull()
  })

  it('resolves demo.de', () => {
    const result = resolveTenant('demo.de')
    expect(result?.slug).toBe('demo')
  })

  it('is case-insensitive', () => {
    const result = resolveTenant('ACME.COM')
    expect(result?.slug).toBe('acme')
  })
})

describe('extractDevPreviewDomain', () => {
  it('extracts domain from /tenant/<domain>/...', () => {
    expect(extractDevPreviewDomain('/tenant/__fixture__.test/en/about')).toBe('__fixture__.test')
  })

  it('extracts domain with no trailing path', () => {
    expect(extractDevPreviewDomain('/tenant/acme.com')).toBe('acme.com')
  })

  it('returns null for non-tenant paths', () => {
    expect(extractDevPreviewDomain('/en/about')).toBeNull()
    expect(extractDevPreviewDomain('/admin')).toBeNull()
    expect(extractDevPreviewDomain('/')).toBeNull()
  })
})
