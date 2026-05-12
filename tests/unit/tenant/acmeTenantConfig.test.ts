import { describe, it, expect } from 'vitest'
import { TenantConfigSchema } from '@/lib/tenant/types'
import { isLocaleEnabled } from '@/lib/i18n/resolveLocale'
import acmeConfig from '@/tenants/acme/tenant.config'

describe('Acme tenant config', () => {
  it('parses successfully against TenantConfigSchema', () => {
    const result = TenantConfigSchema.safeParse(acmeConfig)
    expect(result.success).toBe(true)
  })

  it('has the correct slug, name, and domains', () => {
    expect(acmeConfig.slug).toBe('acme')
    expect(acmeConfig.name).toBe('Acme GmbH')
    expect(acmeConfig.domains).toContain('acme.com')
    expect(acmeConfig.domains).toContain('www.acme.com')
  })

  it('enables en and de locales', () => {
    expect(acmeConfig.locales.enabled).toContain('en')
    expect(acmeConfig.locales.enabled).toContain('de')
  })

  it('does not enable vi locale (proves locale gate)', () => {
    expect(acmeConfig.locales.enabled).not.toContain('vi')
    expect(isLocaleEnabled(acmeConfig, 'vi')).toBe(false)
  })

  it('isLocaleEnabled returns true for enabled locales', () => {
    expect(isLocaleEnabled(acmeConfig, 'en')).toBe(true)
    expect(isLocaleEnabled(acmeConfig, 'de')).toBe(true)
  })

  it('enables home, about, services, contact pages', () => {
    expect(acmeConfig.enabledPages).toContain('home')
    expect(acmeConfig.enabledPages).toContain('about')
    expect(acmeConfig.enabledPages).toContain('services')
    expect(acmeConfig.enabledPages).toContain('contact')
  })

  it('does not enable blog page (proves page-type gate)', () => {
    expect(acmeConfig.enabledPages).not.toContain('blog')
    expect(acmeConfig.enabledPages.includes('blog')).toBe(false)
  })

  it('has 4 navigation items', () => {
    expect(acmeConfig.navigation).toHaveLength(4)
  })

  it('navigation items have en and de labels', () => {
    for (const item of acmeConfig.navigation ?? []) {
      expect(item.label.en).toBeTruthy()
      expect(item.label.de).toBeTruthy()
    }
  })

  it('theme has primaryColor matching brief (#1e40af)', () => {
    expect(acmeConfig.theme?.primaryColor).toBe('#1e40af')
  })

  it('theme has accentColor matching brief (#f59e0b)', () => {
    expect(acmeConfig.theme?.accentColor).toBe('#f59e0b')
  })
})
