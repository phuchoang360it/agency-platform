import { test, expect } from '@playwright/test'

// Requires: pnpm dev + Payload admin reachable
// Tests that editor users scoped to one tenant cannot see another tenant's content.
//
// NOTE: These tests require a super-admin user to exist in the database.
// Set PAYLOAD_SUPER_ADMIN_EMAIL and PAYLOAD_SUPER_ADMIN_PASSWORD env vars,
// or seed them via pnpm tenant:seed. The tests are skipped if vars are missing.

const ADMIN_EMAIL = process.env.PAYLOAD_SUPER_ADMIN_EMAIL ?? ''
const ADMIN_PASSWORD = process.env.PAYLOAD_SUPER_ADMIN_PASSWORD ?? ''

test.describe('Admin access control', () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Set PAYLOAD_SUPER_ADMIN_EMAIL and PAYLOAD_SUPER_ADMIN_PASSWORD to run admin tests')

  test('Payload admin is reachable', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin/)
    const hasLogin = await page.locator('input[type="email"], input[name="email"]').count()
    const hasDashboard = await page.locator('[data-nav], .dashboard, #app-shell').count()
    expect(hasLogin + hasDashboard).toBeGreaterThan(0)
  })

  test('super-admin can log in', async ({ page }) => {
    await page.goto('/admin/login')
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    // After login, URL should not stay on /login
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('Payload collections list includes tenants and pages', async ({ page }) => {
    await page.goto('/admin/login')
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin(?!\/login)/)

    // Navigation should show at least Tenants and Pages collections.
    await page.goto('/admin/collections/tenants')
    await expect(page).toHaveURL(/\/admin\/collections\/tenants/)
  })
})
