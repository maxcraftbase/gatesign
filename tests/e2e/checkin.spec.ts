import { test, expect } from '@playwright/test'

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
    await expect(page.getByText('LKW-Fahrer')).toBeVisible()
    await expect(page.getByText('Besucher')).toBeVisible()
    await expect(page.getByText('Dienstleister')).toBeVisible()
  })

  test('Formular erscheint nach Besuchertyp-Auswahl (LKW)', async ({ page }) => {
    await page.getByRole('button', { name: 'Check-in starten' }).click()
    await page.getByText('Deutsch').click()
    await page.getByText('LKW-Fahrer').click()
    // Pflichtfelder Name + Firma + Kennzeichen
    await expect(page.getByPlaceholder(/name/i).first()).toBeVisible()
  })

  test('Vollständiger Check-in Flow (Deutsch / LKW)', async ({ page }) => {
    await page.getByRole('button', { name: 'Check-in starten' }).click()
    await page.getByText('Deutsch').click()
    await page.getByText('LKW-Fahrer').click()

    // Formular ausfüllen — Reihenfolge: Name, Firma, Kennzeichen
    const inputs = page.locator('input[type="text"], input:not([type])')
    await inputs.nth(0).fill('Max Mustermann')
    await inputs.nth(1).fill('Test GmbH')
    await inputs.nth(2).fill('B-TT 1234')

    // Belehrung bestätigen / Abschicken
    const confirmBtn = page.getByRole('button').filter({ hasText: /bestätig|check.?in|abschi|abschicken/i }).last()
    await confirmBtn.click()

    // Erfolgs-Screen
    await expect(
      page.getByText(/erfolgreich|angemeldet|success|danke/i).first()
    ).toBeVisible({ timeout: 15_000 })
  })
})
