import { describe, it, expect } from 'vitest'
import { resolveLocale, isLocaleEnabled } from '@/lib/i18n/resolveLocale'
import type { TenantConfig } from '@/lib/tenant/types'

const mockConfig: TenantConfig = {
  slug: 'acme',
  name: 'Acme',
  domains: ['acme.com'],
  locales: { enabled: ['en', 'de'], default: 'en', omitDefaultPrefix: false },
  enabledPages: ['home'],
}

describe('isLocaleEnabled', () => {
  it('returns true for enabled locale', () => {
    expect(isLocaleEnabled(mockConfig, 'en')).toBe(true)
    expect(isLocaleEnabled(mockConfig, 'de')).toBe(true)
  })

  it('returns false for disabled locale', () => {
    expect(isLocaleEnabled(mockConfig, 'vi')).toBe(false)
  })

  it('returns false for unsupported platform locale', () => {
    expect(isLocaleEnabled(mockConfig, 'fr')).toBe(false)
    expect(isLocaleEnabled(mockConfig, '')).toBe(false)
  })
})

describe('resolveLocale', () => {
  it('returns requested locale if enabled', () => {
    expect(resolveLocale(mockConfig, 'de')).toBe('de')
    expect(resolveLocale(mockConfig, 'en')).toBe('en')
  })

  it('falls back to default when requested locale is disabled', () => {
    expect(resolveLocale(mockConfig, 'vi')).toBe('en')
  })

  it('falls back to default when locale is undefined', () => {
    expect(resolveLocale(mockConfig, undefined)).toBe('en')
  })

  it('falls back to default when locale is unsupported', () => {
    expect(resolveLocale(mockConfig, 'xyz')).toBe('en')
  })
})
