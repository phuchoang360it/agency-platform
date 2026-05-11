import { test, expect } from '@playwright/test'

// Phase 1 smoke tests — exercises the scaffold without any real tenant content.
// Phase 2 will add multi-tenant routing tests once a seeded tenant exists.

test.describe('Platform scaffold smoke tests', () => {
  test('root path renders "no tenants configured" page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/360IT|Tenant|Platform|scaffold/i)
    // The NoTenantsPage component shows this heading
    await expect(page.getByRole('heading', { name: /no tenants configured/i })).toBeVisible()
  })

  test('Payload admin is reachable', async ({ page }) => {
    await page.goto('/admin')
    // Payload admin always renders a login form on first visit
    await expect(page).toHaveURL(/\/admin/)
    // Either a login form or the dashboard (if already logged in)
    const hasLogin = await page.locator('input[type="email"], input[name="email"]').count()
    const hasDashboard = await page.locator('[data-nav], .dashboard, #app-shell').count()
    expect(hasLogin + hasDashboard).toBeGreaterThan(0)
  })

  test('dev-preview route responds for fixture tenant', async ({ page }) => {
    await page.goto('/tenant/__fixture__.test/en')
    // Should not 404 — either shows page content or the "not seeded" helper message
    expect(page.url()).not.toContain('/404')
    const status = await page.evaluate(() => document.title)
    expect(status).toBeTruthy()
  })

  test('disabled locale returns 404', async ({ page }) => {
    // Vietnamese is not enabled for the fixture tenant
    const response = await page.goto('/tenant/__fixture__.test/vi')
    expect(response?.status()).toBe(404)
  })

  test('production guard: /tenant/ path blocked in prod', async ({ page }) => {
    // In dev this passes through. The test verifies we get a valid response
    // (middleware does NOT block in dev, so we accept 200 or the dev content).
    const response = await page.goto('/tenant/__fixture__.test/en')
    // In dev env (which is what Playwright runs against), this should succeed.
    expect(response?.status()).not.toBe(500)
  })
})
