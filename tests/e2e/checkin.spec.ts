import { test, expect } from '@playwright/test'

/**
 * Smoke-Tests gegen Production (PLAYWRIGHT_BASE_URL).
 *
 * Regel: NUR Visibility-Checks, KEINE Form-Submissions.
 * Echte End-to-End-Tests mit Briefing/Signature gehören gegen lokalen
 * Build mit Test-DB (Phase T4), nicht in eine Smoke-Suite gegen Live —
 * sonst landen Test-Daten in der Production-DB (DSGVO + Datenmüll).
 *
 * Welcome-Screen seit dem Drucker-Add-on (PR #43/#49):
 * Statt eines einzelnen "Check-in starten" gibt es jetzt den Check-in-Button
 * "Check in". Ist das Drucker-Add-on am Terminal aktiv, erscheint zusätzlich
 * ein "Check out"-Button (Split-Layout). Der Check-in-Button trägt in beiden
 * Fällen das Label "Check in" (Literal-Fallback == de-Übersetzung mode_checkin).
 * Da die Smoke-Suite gegen ein Multi-Tenant-Live-Terminal ohne garantiert
 * gepairten Drucker läuft, darf der "Check out"-Button NICHT vorausgesetzt werden.
 */

// Provide your real slug via PLAYWRIGHT_SLUG env var
const SLUG = process.env.PLAYWRIGHT_SLUG ?? 'demo'

// Check-in-Button: in Single- wie Split-Layout immer das Label "Check in".
const checkInButton = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Check in', exact: true })

test.describe('Check-in Terminal — Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    const res = await page.goto(`/${SLUG}`)
    if (res && res.status() === 404) {
      test.skip(true, `Slug "${SLUG}" nicht gefunden — PLAYWRIGHT_SLUG setzen`)
    }
  })

  test('Welcome Screen lädt korrekt', async ({ page }) => {
    await expect(page.getByText('GateSign')).toBeVisible()
    await expect(checkInButton(page)).toBeVisible()
  })

  test('Sprach-Auswahl erscheint nach Start', async ({ page }) => {
    await checkInButton(page).click()
    await expect(page.getByText('Sprache wählen / Choose language')).toBeVisible()
    await expect(page.getByText('Deutsch')).toBeVisible()
    await expect(page.getByText('English')).toBeVisible()
  })

  test('Besuchertyp-Auswahl erscheint nach Sprachauswahl', async ({ page }) => {
    await checkInButton(page).click()
    await page.getByText('Deutsch').click()
    // LKW / Besucher / Dienstleister müssen angezeigt werden
    await expect(page.getByText('LKW / Lieferung')).toBeVisible()
    await expect(page.getByText('Besucher')).toBeVisible()
    await expect(page.getByText('Dienstleister')).toBeVisible()
  })
})
