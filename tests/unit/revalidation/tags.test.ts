import { describe, it, expect } from 'vitest'
import { buildTag, buildRevalidationTags } from '@/lib/revalidation/tags'

describe('buildTag', () => {
  it('builds tenant-only tag', () => {
    expect(buildTag('acme')).toBe('tenant:acme')
  })

  it('builds tenant+locale tag', () => {
    expect(buildTag('acme', 'en')).toBe('tenant:acme:en')
  })

  it('builds tenant+locale+slug tag', () => {
    expect(buildTag('acme', 'en', 'about')).toBe('tenant:acme:en:/about')
  })

  it('normalises slug with leading slash', () => {
    expect(buildTag('acme', 'de', '/about')).toBe('tenant:acme:de:/about')
  })

  it('normalises slug by stripping trailing slash', () => {
    expect(buildTag('acme', 'en', 'services/')).toBe('tenant:acme:en:/services')
  })

  it('handles home slug', () => {
    expect(buildTag('acme', 'en', 'home')).toBe('tenant:acme:en:/home')
  })
})

describe('buildRevalidationTags', () => {
  it('always includes tenant root tag', () => {
    const tags = buildRevalidationTags('acme', ['en', 'de'])
    expect(tags).toContain('tenant:acme')
  })

  it('includes per-locale tags', () => {
    const tags = buildRevalidationTags('acme', ['en', 'de'])
    expect(tags).toContain('tenant:acme:en')
    expect(tags).toContain('tenant:acme:de')
  })

  it('includes per-slug tags when provided', () => {
    const tags = buildRevalidationTags('acme', ['en'], ['about'])
    expect(tags).toContain('tenant:acme:en:/about')
  })

  it('covers all locales when multiple slugs provided', () => {
    const tags = buildRevalidationTags('acme', ['en', 'de'], ['home', 'about'])
    expect(tags).toContain('tenant:acme:en:/home')
    expect(tags).toContain('tenant:acme:de:/about')
  })
})
