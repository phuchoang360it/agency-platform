import { test, expect } from '@playwright/test'

// Requires: pnpm tenant:seed acme && pnpm dev
// Tests that only enabled locales are accessible, and disabled page types 404.

test.describe('Locale resolution for Acme tenant', () => {
  test('/de/about → 200 (German is enabled)', async ({ page }) => {
    const response = await page.goto('/tenant/acme.com/de/about')
    expect(response?.status()).not.toBe(404)
    expect(response?.status()).not.toBe(500)
    // German about page should show German hero heading.
    await expect(page.getByText('Über Acme GmbH')).toBeVisible()
  })

  test('/en/about → 200 (English is enabled)', async ({ page }) => {
    const response = await page.goto('/tenant/acme.com/en/about')
    expect(response?.status()).not.toBe(404)
    await expect(page.getByText('About Acme GmbH')).toBeVisible()
  })

  test('/vi/about → 404 (Vietnamese is disabled for Acme)', async ({ page }) => {
    const response = await page.goto('/tenant/acme.com/vi/about')
    expect(response?.status()).toBe(404)
  })

  test('/vi/ → 404 (Vietnamese home disabled)', async ({ page }) => {
    const response = await page.goto('/tenant/acme.com/vi')
    expect(response?.status()).toBe(404)
  })

  test('/en/services → 200 (services is enabled)', async ({ page }) => {
    const response = await page.goto('/tenant/acme.com/en/services')
    expect(response?.status()).not.toBe(404)
    await expect(page.getByText('Our Services')).toBeVisible()
  })

  test('/en/contact → 200 (contact is enabled)', async ({ page }) => {
    const response = await page.goto('/tenant/acme.com/en/contact')
    expect(response?.status()).not.toBe(404)
  })

  test('/en/blog → 404 (blog page type disabled for Acme)', async ({ page }) => {
    // Even if a blog page somehow existed in the DB for Acme,
    // the enabledPages gate must return 404.
    const response = await page.goto('/tenant/acme.com/en/blog')
    expect(response?.status()).toBe(404)
  })
})
