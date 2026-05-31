/**
 * Unit-Tests für die Add-on-Durchsetzung (src/lib/addons.ts).
 *
 * Fokus: das plan-aware gewordene `hasAddon` — Plan-Bundling (includedIn) wird
 * jetzt aktiv, der Plan wird bei Bedarf selbst geladen. Drucker ist bewusst NICHT
 * gebündelt (braucht Hardware + Pairing).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { hasAddon, addonRequiredError, getAddonQuantity, getActiveAddons, ADDON_REGISTRY } from '@/lib/addons'
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

describe('getAddonQuantity — Mengen-Modell (extra_location)', () => {
  beforeEach(() => vi.restoreAllMocks())

  /** Mockt company_addons mit explizit gesetzten Mengen pro addon_key. */
  function mockAddons(rows: { addon_key: string; quantity?: number }[]) {
    global.fetch = vi.fn().mockImplementation(async (url: string | URL) => {
      const u = url.toString()
      if (u.includes('/rest/v1/company_addons')) {
        return new Response(JSON.stringify(rows.map(r => ({
          company_id: COMPANY_ID,
          addon_key: r.addon_key,
          stripe_subscription_item_id: 'si_x',
          billing_cycle: 'monthly',
          active_since: '2026-01-01T00:00:00Z',
          ...(r.quantity === undefined ? {} : { quantity: r.quantity }),
        }))), { status: 200 })
      }
      throw new Error(`Unmocked fetch: ${u}`)
    }) as unknown as typeof fetch
  }

  it('liefert 0, wenn das Add-on nicht gekauft ist', async () => {
    mockAddons([])
    expect(await getAddonQuantity(COMPANY_ID, 'extra_location')).toBe(0)
  })

  it('liefert die gekaufte Menge zurück', async () => {
    mockAddons([{ addon_key: 'extra_location', quantity: 3 }])
    expect(await getAddonQuantity(COMPANY_ID, 'extra_location')).toBe(3)
  })

  it('behandelt eine fehlende quantity-Spalte als 1 (Default vor Migration 007)', async () => {
    mockAddons([{ addon_key: 'extra_location' }])  // keine quantity im JSON
    expect(await getAddonQuantity(COMPANY_ID, 'extra_location')).toBe(1)
  })

  it('floored ungültige Werte (0/negativ) auf 1', async () => {
    mockAddons([{ addon_key: 'extra_location', quantity: 0 }])
    expect(await getAddonQuantity(COMPANY_ID, 'extra_location')).toBe(1)
  })

  it('fällt auf den Select OHNE quantity zurück, wenn die Spalte fehlt (PostgREST 400)', async () => {
    // Simuliert den Deploy-vor-Migration-Zustand: erster Select (mit quantity) → 400,
    // zweiter Select (ohne quantity) → 200. Ergebnis: extra_location aktiv, Menge = 1.
    global.fetch = vi.fn().mockImplementation(async (url: string | URL) => {
      const u = url.toString()
      if (u.includes('/rest/v1/company_addons')) {
        if (u.includes('quantity')) return new Response('column does not exist', { status: 400 })
        return new Response(JSON.stringify([{
          company_id: COMPANY_ID, addon_key: 'extra_location',
          stripe_subscription_item_id: 'si_x', billing_cycle: 'monthly', active_since: '2026-01-01T00:00:00Z',
        }]), { status: 200 })
      }
      throw new Error(`Unmocked fetch: ${u}`)
    }) as unknown as typeof fetch
    expect(await getAddonQuantity(COMPANY_ID, 'extra_location')).toBe(1)
  })
})

describe('getActiveAddons — Batch-Gating (ein Plan- + ein Add-on-Lookup)', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('löst Plan-Bundling + Käufe gemischt korrekt auf', async () => {
    // Business → audit_export gebündelt; printer nur durch Kauf.
    mockDb('business', ['printer'])
    const flags = await getActiveAddons(COMPANY_ID, ['audit_export', 'printer', 'custom_branding'])
    expect(flags.audit_export).toBe(true)   // gebündelt in business
    expect(flags.printer).toBe(true)        // explizit gekauft
    expect(flags.custom_branding).toBe(false) // nur enterprise, nicht gekauft
  })

  it('liefert nur die angefragten Keys zurück', async () => {
    mockDb('enterprise', [])
    const flags = await getActiveAddons(COMPANY_ID, ['printer'])
    expect(Object.keys(flags)).toEqual(['printer'])
    expect(flags.printer).toBe(false)  // auch in Enterprise nicht gebündelt
  })

  it('macht max. einen companies- und einen company_addons-Lookup', async () => {
    mockDb('enterprise', [])
    const fetchSpy = global.fetch as unknown as ReturnType<typeof vi.fn>
    await getActiveAddons(COMPANY_ID, ['audit_export', 'custom_branding', 'briefing_translation', 'printer'])
    const urls = fetchSpy.mock.calls.map(c => String(c[0]))
    expect(urls.filter(u => u.includes('/rest/v1/companies')).length).toBe(1)
    expect(urls.filter(u => u.includes('/rest/v1/company_addons')).length).toBe(1)
  })

  it('expliziter plan-Parameter spart den companies-Lookup komplett', async () => {
    mockDb(null, [])  // companies würde leer liefern
    const fetchSpy = global.fetch as unknown as ReturnType<typeof vi.fn>
    const flags = await getActiveAddons(COMPANY_ID, ['audit_export'], 'enterprise')
    expect(flags.audit_export).toBe(true)
    const urls = fetchSpy.mock.calls.map(c => String(c[0]))
    expect(urls.some(u => u.includes('/rest/v1/companies'))).toBe(false)
  })

  it('fragt companies gar nicht ab, wenn kein Key Plan-Bundling nutzt (z. B. nur printer)', async () => {
    mockDb('business', [])
    const fetchSpy = global.fetch as unknown as ReturnType<typeof vi.fn>
    await getActiveAddons(COMPANY_ID, ['printer'])
    const urls = fetchSpy.mock.calls.map(c => String(c[0]))
    expect(urls.some(u => u.includes('/rest/v1/companies'))).toBe(false)
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
