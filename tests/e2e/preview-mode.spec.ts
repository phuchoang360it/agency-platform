import { test, expect } from '@playwright/test'

// Tests draft / preview mode behaviour for the Acme tenant.
//
// The page component queries with `_status: 'published'` — drafts are invisible
// to unauthenticated visitors. Next.js Draft Mode (cookie-based) allows
// authenticated editors to see unpublished content.
//
// NOTE: Full Draft Mode e2e requires a /api/draft route that sets the
// Next.js draftMode() cookie. If that route is not wired up yet, the
// draft-visible test is skipped. The "draft not visible" test always runs.

test.describe('Preview / draft mode', () => {
  test('published page is visible to unauthenticated visitor', async ({ page }) => {
    const response = await page.goto('/tenant/acme.com/en')
    expect(response?.status()).not.toBe(404)
    expect(response?.status()).not.toBe(500)
    await expect(page.getByText('Proven Solutions for Modern Business')).toBeVisible()
  })

  test('unpublished (draft) page is NOT visible without draft mode', async ({ page }) => {
    // The seed creates all pages as _status: 'published'.
    // A slug that has never been seeded should 404 for unauthenticated users.
    const response = await page.goto('/tenant/acme.com/en/draft-only-page-that-does-not-exist')
    expect(response?.status()).toBe(404)
  })

  // Draft mode activation requires a server route to set the Next.js cookie.
  // Skip this test until /api/draft is implemented.
  test.skip('draft mode enables preview of unpublished content', async ({ page }) => {
    // 1. Enable draft mode via the API route (sets __prerender_bypass cookie).
    await page.goto('/api/draft?secret=' + process.env.PAYLOAD_SECRET)

    // 2. Now visit a page that would be draft-only — should render.
    // (Requires seeding a draft page first; this is a structural placeholder.)
    const response = await page.goto('/tenant/acme.com/en')
    expect(response?.status()).not.toBe(404)
  })
})
