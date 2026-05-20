import { test, expect } from '@playwright/test'

/**
 * Smoke-Tests gegen Production (PLAYWRIGHT_BASE_URL).
 *
 * Regel: NUR Visibility-Checks, KEINE Form-Submissions.
 * Echte End-to-End-Tests mit Briefing/Signature gehören gegen lokalen
 * Build mit Test-DB (Phase T4), nicht in eine Smoke-Suite gegen Live —
 * sonst landen Test-Daten in der Production-DB (DSGVO + Datenmüll).
 */

// Provide your real slug via PLAYWRIGHT_SLUG env var
const SLUG = process.env.PLAYWRIGHT_SLUG ?? 'demo'

test.describe('Check-in Terminal — Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    const res = await page.goto(`/${SLUG}`)
    if (res && res.status() === 404) {
      test.skip(true, `Slug "${SLUG}" nicht gefunden — PLAYWRIGHT_SLUG setzen`)
    }
  })

  test('Welcome Screen lädt korrekt', async ({ page }) => {
    await expect(page.getByText('GateSign')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Check-in starten' })).toBeVisible()
  })

  test('Sprach-Auswahl erscheint nach Start', async ({ page }) => {
    await page.getByRole('button', { name: 'Check-in starten' }).click()
    await expect(page.getByText('Sprache wählen / Choose language')).toBeVisible()
    await expect(page.getByText('Deutsch')).toBeVisible()
    await expect(page.getByText('English')).toBeVisible()
  })

  test('Besuchertyp-Auswahl erscheint nach Sprachauswahl', async ({ page }) => {
    await page.getByRole('button', { name: 'Check-in starten' }).click()
    await page.getByText('Deutsch').click()
    // LKW / Besucher / Dienstleister müssen angezeigt werden
    await expect(page.getByText('LKW / Lieferung')).toBeVisible()
    await expect(page.getByText('Besucher')).toBeVisible()
    await expect(page.getByText('Dienstleister')).toBeVisible()
  })
})
