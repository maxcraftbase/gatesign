/**
 * Integration-Test: Add-on-Gates auf den echten Admin-Routen.
 *
 * Prüft, dass die kostenpflichtigen Funktionen serverseitig hart gesperrt sind,
 * wenn das zugehörige Add-on weder über den Plan gebündelt noch explizit gekauft
 * wurde — und sich öffnen, sobald das Add-on aktiv ist (Plan-Bundling ODER Kauf).
 *
 * Die Routen rufen `getAdminContext()` (gemockt) und danach `hasAddon()` auf,
 * das selbst `getCompanyPlan` (companies) + `getCompanyAddons` (company_addons)
 * per fetch lädt. Beides wird hier gemockt.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { AdminContext } from '@/lib/admin-auth'
import type { PlanName } from '@/lib/subscription'

vi.mock('@/lib/admin-auth', () => ({ getAdminContext: vi.fn() }))

import { getAdminContext } from '@/lib/admin-auth'
import { GET as exportCsv } from '@/app/api/admin/export/route'
import { GET as exportXlsx } from '@/app/api/admin/export/xlsx/route'
import { POST as translateHints } from '@/app/api/admin/translate-hints/route'
import { POST as translateNote } from '@/app/api/admin/translate-note/route'
import { POST as uploadLogo } from '@/app/api/admin/upload-logo/route'

const COMPANY_ID = 'company-123'
const mockedGetAdminContext = vi.mocked(getAdminContext)

function setAdmin() {
  const ctx: AdminContext = {
    accessToken: 'token-abc',
    userId: 'user-1',
    email: 'admin@test.de',
    name: 'Admin',
    role: 'admin',
    company: { id: COMPANY_ID, name: 'Test Firma', slug: 'test-firma' },
  }
  mockedGetAdminContext.mockResolvedValue(ctx)
}

/**
 * Mockt fetch für getCompanyPlan (companies), getCompanyAddons (company_addons)
 * und — für Positiv-Pfade — den check_ins-Export.
 */
function mockDb(plan: PlanName | null, addonKeys: string[] = []) {
  global.fetch = vi.fn().mockImplementation(async (url: string | URL) => {
    const u = url.toString()
    if (u.includes('/rest/v1/companies')) {
      const rows = plan ? [{ plan, terminal_limit: null, billing_cycle: 'monthly' }] : []
      return new Response(JSON.stringify(rows), { status: 200 })
    }
    if (u.includes('/rest/v1/company_addons')) {
      const rows = addonKeys.map(addon_key => ({
        company_id: COMPANY_ID,
        addon_key,
        stripe_subscription_item_id: 'si_x',
        billing_cycle: 'monthly',
        active_since: '2026-01-01T00:00:00Z',
      }))
      return new Response(JSON.stringify(rows), { status: 200 })
    }
    if (u.includes('/rest/v1/check_ins')) {
      return new Response(JSON.stringify([
        { id: 'ci-1', created_at: '2026-05-31T08:00:00Z', visitor_type: 'visitor', driver_name: 'Max' },
      ]), { status: 200 })
    }
    throw new Error(`Unmocked fetch: ${u}`)
  }) as unknown as typeof fetch
}

function jsonRequest(body: unknown): NextRequest {
  return new NextRequest('http://test.local/api/admin/x', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => setAdmin())

describe('Add-on-Gate: gesperrt ohne Add-on (Solo-Plan, kein Kauf)', () => {
  it('export CSV → 403 addon_required (audit_export)', async () => {
    mockDb('solo', [])
    const res = await exportCsv()
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('addon_required')
    expect(body.addon).toBe('audit_export')
  })

  it('export XLSX → 403 addon_required (audit_export)', async () => {
    mockDb('solo', [])
    const res = await exportXlsx()
    expect(res.status).toBe(403)
    expect((await res.json()).addon).toBe('audit_export')
  })

  it('translate-hints → 403 addon_required (briefing_translation)', async () => {
    mockDb('solo', [])
    const res = await translateHints(jsonRequest({ hints: ['Helm tragen'] }))
    expect(res.status).toBe(403)
    expect((await res.json()).addon).toBe('briefing_translation')
  })

  it('translate-note → 403 addon_required (briefing_translation)', async () => {
    mockDb('business', [])  // auch Business hat briefing_translation NICHT gebündelt
    const res = await translateNote(jsonRequest({ text: 'Hallo', targetLanguage: 'pl' }))
    expect(res.status).toBe(403)
    expect((await res.json()).addon).toBe('briefing_translation')
  })

  it('upload-logo → 403 addon_required (custom_branding)', async () => {
    mockDb('business', [])  // custom_branding nur in Enterprise gebündelt
    const res = await uploadLogo(jsonRequest({}))
    expect(res.status).toBe(403)
    expect((await res.json()).addon).toBe('custom_branding')
  })
})

describe('Add-on-Gate: offen wenn Add-on aktiv', () => {
  it('export CSV in Business (audit_export gebündelt) → 200 CSV', async () => {
    mockDb('business', [])
    const res = await exportCsv()
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/csv')
  })

  it('export CSV in Solo MIT gekauftem audit_export → 200 CSV', async () => {
    mockDb('solo', ['audit_export'])
    const res = await exportCsv()
    expect(res.status).toBe(200)
  })

  it('translate-note in Enterprise (briefing_translation gebündelt) → Gate offen', async () => {
    mockDb('enterprise', [])
    // targetLanguage 'de' → früher Return ohne DeepL-Call, beweist: Gate passiert.
    const res = await translateNote(jsonRequest({ text: 'Hallo', targetLanguage: 'de' }))
    expect(res.status).toBe(200)
    expect((await res.json()).translated).toBe('Hallo')
  })

  it('upload-logo in Enterprise (custom_branding gebündelt) → Gate offen (kein 403)', async () => {
    mockDb('enterprise', [])
    // Ohne Datei läuft die Route nach dem Gate in einen 400 — entscheidend ist nur,
    // dass sie NICHT mehr am Add-on-Gate (403) hängenbleibt.
    const res = await uploadLogo(jsonRequest({}))
    expect(res.status).not.toBe(403)
  })
})
