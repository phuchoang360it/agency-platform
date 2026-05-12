import { test, expect } from '@playwright/test'

// Requires: pnpm tenant:seed acme && pnpm dev
// Tests that the per-tenant sitemap contains only enabled locales.

test.describe('Acme sitemap', () => {
  test('sitemap.xml is served for acme.com (via dev path)', async ({ request }) => {
    // The sitemap route reads x-tenant-domain from headers.
    // In dev, we hit /sitemap.xml with the Host header set to acme.com.
    const response = await request.get('/sitemap.xml', {
      headers: { host: 'acme.com' },
    })
    // Accept 200 only
    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).toContain('<urlset')
  })

  test('sitemap contains English URLs', async ({ request }) => {
    const response = await request.get('/sitemap.xml', {
      headers: { host: 'acme.com' },
    })
    const body = await response.text()
    expect(body).toContain('/en')
  })

  test('sitemap contains German URLs', async ({ request }) => {
    const response = await request.get('/sitemap.xml', {
      headers: { host: 'acme.com' },
    })
    const body = await response.text()
    expect(body).toContain('/de')
  })

  test('sitemap does NOT contain Vietnamese URLs (vi disabled for Acme)', async ({ request }) => {
    const response = await request.get('/sitemap.xml', {
      headers: { host: 'acme.com' },
    })
    const body = await response.text()
    expect(body).not.toContain('/vi')
  })

  test('sitemap URLs reference acme.com as base domain', async ({ request }) => {
    const response = await request.get('/sitemap.xml', {
      headers: { host: 'acme.com' },
    })
    const body = await response.text()
    expect(body).toContain('acme.com')
  })

  test('fixture tenant sitemap does not bleed into acme sitemap', async ({ request }) => {
    const response = await request.get('/sitemap.xml', {
      headers: { host: 'acme.com' },
    })
    const body = await response.text()
    // Fixture tenant slug should not appear in acme's sitemap.
    expect(body).not.toContain('__fixture__')
  })
})
