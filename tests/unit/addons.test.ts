/**
 * Unit-Tests für die Add-on-Durchsetzung (src/lib/addons.ts).
 *
 * Fokus: das plan-aware gewordene `hasAddon` — Plan-Bundling (includedIn) wird
 * jetzt aktiv, der Plan wird bei Bedarf selbst geladen. Drucker ist bewusst NICHT
 * gebündelt (braucht Hardware + Pairing).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { hasAddon, addonRequiredError, ADDON_REGISTRY } from '@/lib/addons'
import type { PlanName } from '@/lib/subscription'

const COMPANY_ID = 'company-123'

/**
 * Mockt fetch für getCompanyPlan (companies) + getCompanyAddons (company_addons).
 * @param plan        Plan, den die Company-Zeile zurückgibt (oder null = keine Zeile)
 * @param addonKeys   addon_key-Werte, die als aktive company_addons-Zeilen existieren
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
    throw new Error(`Unmocked fetch: ${u}`)
  }) as unknown as typeof fetch
}

describe('hasAddon — Plan-Bundling (includedIn)', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('audit_export ist in Business automatisch aktiv (ohne DB-Zeile)', async () => {
    mockDb('business', [])
    expect(await hasAddon(COMPANY_ID, 'audit_export')).toBe(true)
  })

  it('audit_export ist in Enterprise automatisch aktiv', async () => {
    mockDb('enterprise', [])
    expect(await hasAddon(COMPANY_ID, 'audit_export')).toBe(true)
  })

  it('audit_export ist in Solo NICHT automatisch aktiv', async () => {
    mockDb('solo', [])
    expect(await hasAddon(COMPANY_ID, 'audit_export')).toBe(false)
  })

  it('audit_export wird in Solo durch expliziten Kauf (DB-Zeile) aktiv', async () => {
    mockDb('solo', ['audit_export'])
    expect(await hasAddon(COMPANY_ID, 'audit_export')).toBe(true)
  })

  it('expliziter plan-Parameter hat Vorrang und spart den Company-Lookup', async () => {
    mockDb(null, [])  // keine companies-Zeile — würde bei DB-Lookup null liefern
    expect(await hasAddon(COMPANY_ID, 'audit_export', 'enterprise')).toBe(true)
  })

  it('briefing_translation ist nur in Enterprise gebündelt, nicht in Business', async () => {
    mockDb('business', [])
    expect(await hasAddon(COMPANY_ID, 'briefing_translation')).toBe(false)
    mockDb('enterprise', [])
    expect(await hasAddon(COMPANY_ID, 'briefing_translation')).toBe(true)
  })
})

describe('hasAddon — Drucker ist NICHT über den Plan gebündelt', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('printer ist auch in Enterprise NICHT automatisch aktiv', async () => {
    mockDb('enterprise', [])
    expect(await hasAddon(COMPANY_ID, 'printer')).toBe(false)
  })

  it('printer wird nur durch expliziten Kauf + Pairing (DB-Zeile) aktiv', async () => {
    mockDb('enterprise', ['printer'])
    expect(await hasAddon(COMPANY_ID, 'printer')).toBe(true)
  })

  it('printer.includedIn ist leer (Registry-Invariante)', () => {
    expect(ADDON_REGISTRY.printer.includedIn).toEqual([])
  })
})

describe('addonRequiredError', () => {
  it('liefert die einheitliche 403-Form mit Add-on-Label', () => {
    const err = addonRequiredError('audit_export')
    expect(err.error).toBe('addon_required')
    expect(err.addon).toBe('audit_export')
    expect(err.message).toContain(ADDON_REGISTRY.audit_export.label)
  })
})
