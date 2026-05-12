import { test, expect } from '@playwright/test'

// Requires: pnpm tenant:seed acme && pnpm dev
// Tests that Host-header routing correctly identifies and renders the Acme tenant.

test.describe('Multi-tenant routing (Host header)', () => {
  test('acme.com host → renders Acme home page', async ({ page }) => {
    // Override the Host header so the middleware resolves to acme tenant.
    // Dev path used here since we cannot change DNS in tests.
    const response = await page.goto('/tenant/acme.com/en')
    expect(response?.status()).not.toBe(404)
    expect(response?.status()).not.toBe(500)

    // Acme home page must contain the seeded hero heading.
    await expect(page.getByText('Proven Solutions for Modern Business')).toBeVisible()
  })

  test('www.acme.com domain → same tenant resolves', async ({ page }) => {
    const response = await page.goto('/tenant/www.acme.com/en')
    expect(response?.status()).not.toBe(404)
    // www.acme.com maps to the same acme config.
    await expect(page.getByText('Proven Solutions for Modern Business')).toBeVisible()
  })

  test('unknown domain → 404', async ({ page }) => {
    // Simulate a Host header for an unknown domain.
    // In dev, /tenant/<unknown-domain>/en will not resolve a config → 404.
    const response = await page.goto('/tenant/unknown-xyz-does-not-exist.example/en')
    expect(response?.status()).toBe(404)
  })

  test('acme.com German home renders German content', async ({ page }) => {
    const response = await page.goto('/tenant/acme.com/de')
    expect(response?.status()).not.toBe(404)
    await expect(page.getByText('Bewährte Lösungen für modernes Business')).toBeVisible()
  })
})
