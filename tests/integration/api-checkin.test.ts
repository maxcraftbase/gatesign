/**
 * Integration-Test: echte POST /api/check-in Route
 *
 * Importiert den echten Handler aus @/app/api/check-in/route und ruft ihn mit
 * gemocktem fetch auf. Testet das Zusammenspiel von Zod-Validation, Rate Limit
 * und Supabase-Insert.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// `after()` braucht einen Request-Scope, den es im Direkt-Aufruf des Handlers
// nicht gibt → würde werfen. Wir mocken nur `after` (Rest von next/server bleibt
// echt) und führen den Callback nicht aus — der Print-Job-Pfad ist separat getestet.
vi.mock('next/server', async (importActual) => {
  const actual = await importActual<typeof import('next/server')>()
  return { ...actual, after: (_fn: () => unknown) => {} }
})

import { POST } from '@/app/api/check-in/route'

const SLUG = 'test-firma'
const COMPANY_ID = 'company-123'
const TERMINAL_SLUG = 'eingang'
const TERMINAL_ID = 'terminal-123'

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    slug: SLUG,
    driver_name: 'Max Mustermann',
    company_name: 'Fremdfirma GmbH',
    license_plate: 'M-AB 1234',
    language: 'de',
    briefing_accepted: true,
    has_signature: true,
    ...overrides,
  }
}

function makeRequest(body: unknown, ip = `10.0.0.${Math.floor(Math.random() * 254) + 1}`): NextRequest {
  return new NextRequest('http://test.local/api/check-in', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  })
}

/** Mockt fetch so, dass Company-Lookup + Check-in-Insert beide erfolgreich antworten. */
function mockSupabaseHappyPath() {
  global.fetch = vi.fn().mockImplementation(async (url: string | URL) => {
    const u = url.toString()
    if (u.includes('/rest/v1/companies')) {
      return new Response(JSON.stringify([{ id: COMPANY_ID, name: 'Test Firma' }]), { status: 200 })
    }
    if (u.includes('/rest/v1/check_ins')) {
      return new Response(JSON.stringify([{ id: 'check-in-id-1' }]), { status: 201 })
    }
    throw new Error(`Unmocked fetch: ${u}`)
  }) as unknown as typeof fetch
}

describe('POST /api/check-in', () => {
  beforeEach(() => {
    mockSupabaseHappyPath()
  })

  it('legt Check-in bei validem Payload an und returnt id', async () => {
    const res = await POST(makeRequest(validPayload()))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ success: true, id: 'check-in-id-1' })
  })

  it('returnt 400 bei fehlendem driver_name', async () => {
    const res = await POST(makeRequest(validPayload({ driver_name: '' })))
    expect(res.status).toBe(400)
  })

  it('returnt 400 bei unbekannter Sprache', async () => {
    const res = await POST(makeRequest(validPayload({ language: 'klingonisch' })))
    expect(res.status).toBe(400)
  })

  it('returnt 500 wenn Supabase-Insert scheitert', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string | URL) => {
      const u = url.toString()
      if (u.includes('/rest/v1/companies')) {
        return new Response(JSON.stringify([{ id: COMPANY_ID }]), { status: 200 })
      }
      if (u.includes('/rest/v1/check_ins')) {
        return new Response('db down', { status: 500 })
      }
      throw new Error(`Unmocked: ${u}`)
    }) as unknown as typeof fetch

    const res = await POST(makeRequest(validPayload()))
    expect(res.status).toBe(500)
  })

  it('greift Rate-Limit: 21. Request derselben IP wird mit 429 abgewiesen', async () => {
    const ip = `10.42.${Math.floor(Math.random() * 254)}.1`
    // Limit ist 20 pro 10min in der Route
    for (let i = 0; i < 20; i++) {
      const r = await POST(makeRequest(validPayload(), ip))
      expect(r.status).toBe(200)
    }
    const blocked = await POST(makeRequest(validPayload(), ip))
    expect(blocked.status).toBe(429)
  })
})

describe('POST /api/check-in — Kartendruck-Scope (Besucher + Service)', () => {
  const CARD_NUMBER = 42

  /**
   * Mockt den vollen Drucker-Pfad: Company + Terminal vorhanden, Drucker-Add-on
   * aktiv. Gibt den fetch-Spy zurück, damit Tests prüfen können, ob
   * allocate_card_number tatsächlich aufgerufen wurde (= Karte vergeben).
   */
  function mockPrinterActive() {
    const fetchSpy = vi.fn().mockImplementation(async (url: string | URL) => {
      const u = url.toString()
      if (u.includes('/rest/v1/companies')) {
        return new Response(JSON.stringify([{ id: COMPANY_ID, name: 'Test Firma' }]), { status: 200 })
      }
      if (u.includes('/rest/v1/terminals')) {
        return new Response(JSON.stringify([{
          id: TERMINAL_ID,
          company_id: COMPANY_ID,
          name: 'Eingang',
          slug: TERMINAL_SLUG,
          is_active: true,
          sort_order: 0,
          created_at: '2026-01-01T00:00:00Z',
          allowed_visitor_types: 'truck,visitor,service',
        }]), { status: 200 })
      }
      if (u.includes('/rest/v1/company_addons')) {
        return new Response(JSON.stringify([{
          company_id: COMPANY_ID,
          addon_key: 'printer',
          stripe_subscription_item_id: 'si_123',
          billing_cycle: 'monthly',
          active_since: '2026-01-01T00:00:00Z',
        }]), { status: 200 })
      }
      if (u.includes('/rest/v1/rpc/allocate_card_number')) {
        return new Response(JSON.stringify(CARD_NUMBER), { status: 200 })
      }
      // after(): Bridge-Lookup gibt nichts zurück → Render/Job-Pfad kurzgeschlossen
      if (u.includes('/rest/v1/print_bridges')) {
        return new Response(JSON.stringify([]), { status: 200 })
      }
      if (u.includes('/rest/v1/check_ins')) {
        return new Response(JSON.stringify([{ id: 'check-in-id-1' }]), { status: 201 })
      }
      throw new Error(`Unmocked fetch: ${u}`)
    })
    global.fetch = fetchSpy as unknown as typeof fetch
    return fetchSpy
  }

  function calledAllocate(fetchSpy: ReturnType<typeof vi.fn>): boolean {
    return fetchSpy.mock.calls.some(([url]) =>
      url.toString().includes('/rest/v1/rpc/allocate_card_number'))
  }

  it('vergibt Tagesnummer für Besucher (visitor)', async () => {
    const fetchSpy = mockPrinterActive()
    const res = await POST(makeRequest(validPayload({
      terminal_slug: TERMINAL_SLUG,
      visitor_type: 'visitor',
    })))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ success: true, card_number: CARD_NUMBER })
    expect(calledAllocate(fetchSpy)).toBe(true)
  })

  it('vergibt Tagesnummer für Service-Mitarbeiter (service)', async () => {
    const fetchSpy = mockPrinterActive()
    const res = await POST(makeRequest(validPayload({
      terminal_slug: TERMINAL_SLUG,
      visitor_type: 'service',
    })))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ success: true, card_number: CARD_NUMBER })
    expect(calledAllocate(fetchSpy)).toBe(true)
  })

  it('vergibt KEINE Tagesnummer für LKW-Fahrer (truck), Check-in bleibt erfolgreich', async () => {
    const fetchSpy = mockPrinterActive()
    const res = await POST(makeRequest(validPayload({
      terminal_slug: TERMINAL_SLUG,
      visitor_type: 'truck',
    })))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ success: true, id: 'check-in-id-1' })
    expect(body.card_number).toBeUndefined()
    expect(calledAllocate(fetchSpy)).toBe(false)
  })

  it('default visitor_type (truck) bekommt ebenfalls keine Tagesnummer', async () => {
    const fetchSpy = mockPrinterActive()
    // Kein visitor_type → Route defaultet auf 'truck'
    const res = await POST(makeRequest(validPayload({ terminal_slug: TERMINAL_SLUG })))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.card_number).toBeUndefined()
    expect(calledAllocate(fetchSpy)).toBe(false)
  })
})
