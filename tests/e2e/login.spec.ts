import { test, expect } from '@playwright/test'

const SLUG = process.env.PLAYWRIGHT_SLUG ?? 'demo'

test.describe('Admin Login — Smoke Tests', () => {
  test('Login-Seite lädt korrekt', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByPlaceholder(/admin@/i)).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /anmeld|login|sign.?in/i })).toBeVisible()
  })

  test('Fehlermeldung bei falschen Credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/admin@/i).fill('wrong@example.com')
    await page.locator('input[type="password"]').fill('wrongpassword')
    await page.getByRole('button', { name: /anmeld|login|sign.?in/i }).click()
    // Fehlermeldung muss erscheinen (kein Redirect auf Admin)
    await expect(
      page.getByText(/falsch|ungültig|invalid|incorrect|fehler|error/i).first()
    ).toBeVisible({ timeout: 10_000 })
    await expect(page).not.toHaveURL(`/${SLUG}/admin`)
  })

  test('Admin-Bereich ohne Login nicht zugänglich', async ({ page }) => {
    // Nur ersten Redirect abwarten — danach Redirect-Loop möglich wenn Slug nicht existiert
    await page.goto(`/${SLUG}/admin`, { waitUntil: 'commit' }).catch(() => {})
    // Entweder auf /login oder auf /password — niemals auf /admin
    const url = page.url()
    expect(url).not.toMatch(new RegExp(`/${SLUG}/admin$`))
  })

  test('Passwort-vergessen-Link vorhanden', async ({ page }) => {
    await page.goto('/login')
    const forgotLink = page.getByRole('link', { name: /vergessen|forgot|reset/i })
    await expect(forgotLink).toBeVisible()
  })
})
