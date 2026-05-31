/**
 * Integration-Test: echte POST /api/check-out Route (Self-Service-Checkout)
 *
 * Importiert den echten Handler und ruft ihn mit gemocktem fetch auf. Prüft:
 * Tagesnummer-Lookup, Terminal-Scoping, kanonisches departed_at-Schreiben,
 * not_found, Rate-Limit und Validierung.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/check-out/route'

const SLUG = 'test-firma'
const TERMINAL_SLUG = 'tor-nord'
const COMPANY_ID = 'company-123'
const TERMINAL_ID = 'terminal-abc'
const CHECK_IN_ID = 'check-in-id-1'

function makeRequest(body: unknown, ip = `10.0.0.${Math.floor(Math.random() * 254) + 1}`): NextRequest {
  return new NextRequest('http://test.local/api/check-out', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  })
}

/** Sammelt alle fetch-Calls, damit Tests URL + Body inspizieren können. */
interface Capture { url: string; method: string; body: unknown }
let calls: Capture[] = []

function mockHappyPath(openRows: unknown[] = [{
  id: CHECK_IN_ID,
  driver_name: 'Max Mustermann',
  company_name: 'Fremdfirma GmbH',
  card_number: 42,
  card_date: '2026-05-31',
}]) {
  calls = []
  global.fetch = vi.fn().mockImplementation(async (url: string | URL, init?: RequestInit) => {
    const u = url.toString()
    const method = init?.method ?? 'GET'
    let body: unknown
    try { body = init?.body ? JSON.parse(String(init.body)) : undefined } catch { body = init?.body }
    calls.push({ url: u, method, body })

    if (u.includes('/rest/v1/companies')) {
      return new Response(JSON.stringify([{ id: COMPANY_ID, name: 'Test Firma' }]), { status: 200 })
    }
    if (u.includes('/rest/v1/terminals')) {
      return new Response(JSON.stringify([{ id: TERMINAL_ID, company_id: COMPANY_ID, name: 'Tor Nord', slug: TERMINAL_SLUG, is_active: true, sort_order: 0, created_at: '', allowed_visitor_types: '[]' }]), { status: 200 })
    }
    if (u.includes('/rest/v1/check_ins')) {
      // GET = Lookup des offenen Check-ins, PATCH = Checkout-Update
      if (method === 'PATCH') return new Response(null, { status: 204 })
      return new Response(JSON.stringify(openRows), { status: 200 })
    }
    throw new Error(`Unmocked fetch: ${method} ${u}`)
  }) as unknown as typeof fetch
}

describe('POST /api/check-out', () => {
  beforeEach(() => { mockHappyPath() })

  it('checkt offenen Besucher per Tagesnummer aus und gibt Namen zurück', async () => {
    const res = await POST(makeRequest({ slug: SLUG, card_number: 42 }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ success: true, visitor_name: 'Max Mustermann', card_number: 42 })
  })

  it('schreibt kanonisches departed_at + checked_out_at + checkout_method=card_number', async () => {
    await POST(makeRequest({ slug: SLUG, card_number: 42 }))
    const patch = calls.find(c => c.method === 'PATCH' && c.url.includes('/rest/v1/check_ins'))
    expect(patch).toBeDefined()
    const patchBody = patch!.body as Record<string, unknown>
    expect(patchBody.checkout_method).toBe('card_number')
    expect(typeof patchBody.checked_out_at).toBe('string')
    // departed_at MUSS mitgeschrieben werden, sonst zählt die KPI "Auf Gelände" falsch
    expect(typeof patchBody.departed_at).toBe('string')
  })

  it('scoped den Lookup aufs Terminal, wenn terminal_slug übergeben wird', async () => {
    await POST(makeRequest({ slug: SLUG, terminal_slug: TERMINAL_SLUG, card_number: 42 }))
    const lookup = calls.find(c => c.method === 'GET' && c.url.includes('/rest/v1/check_ins'))
    expect(lookup).toBeDefined()
    expect(lookup!.url).toContain(`terminal_id=eq.${TERMINAL_ID}`)
  })

  it('lookup OHNE terminal-Filter, wenn kein terminal_slug übergeben wird', async () => {
    await POST(makeRequest({ slug: SLUG, card_number: 42 }))
    const lookup = calls.find(c => c.method === 'GET' && c.url.includes('/rest/v1/check_ins'))
    expect(lookup!.url).not.toContain('terminal_id=eq.')
  })

  it('returnt 404 not_found, wenn keine offene Karte mit der Nummer existiert', async () => {
    mockHappyPath([])
    const res = await POST(makeRequest({ slug: SLUG, card_number: 999 }))
    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe('not_found')
  })

  it('returnt 404, wenn die Firma nicht existiert', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string | URL) => {
      if (url.toString().includes('/rest/v1/companies')) return new Response(JSON.stringify([]), { status: 200 })
      throw new Error('should not reach lookup')
    }) as unknown as typeof fetch
    const res = await POST(makeRequest({ slug: 'gibts-nicht', card_number: 42 }))
    expect(res.status).toBe(404)
  })

  it('returnt 400 bei ungültiger Eingabe (card_number fehlt)', async () => {
    const res = await POST(makeRequest({ slug: SLUG }))
    expect(res.status).toBe(400)
  })

  it('returnt 400 bei nicht-positiver Tagesnummer', async () => {
    const res = await POST(makeRequest({ slug: SLUG, card_number: 0 }))
    expect(res.status).toBe(400)
  })

  it('returnt 500, wenn der Checkout-PATCH scheitert', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string | URL, init?: RequestInit) => {
      const u = url.toString()
      const method = init?.method ?? 'GET'
      if (u.includes('/rest/v1/companies')) return new Response(JSON.stringify([{ id: COMPANY_ID }]), { status: 200 })
      if (u.includes('/rest/v1/check_ins') && method === 'PATCH') return new Response('db down', { status: 500 })
      if (u.includes('/rest/v1/check_ins')) return new Response(JSON.stringify([{ id: CHECK_IN_ID, driver_name: 'X', company_name: 'Y', card_number: 42, card_date: null }]), { status: 200 })
      throw new Error(`Unmocked: ${method} ${u}`)
    }) as unknown as typeof fetch
    const res = await POST(makeRequest({ slug: SLUG, card_number: 42 }))
    expect(res.status).toBe(500)
  })

  it('greift Rate-Limit: 21. Request derselben IP wird mit 429 abgewiesen', async () => {
    const ip = `10.43.${Math.floor(Math.random() * 254)}.1`
    // Limit ist 20 pro 10min in der Route
    for (let i = 0; i < 20; i++) {
      const r = await POST(makeRequest({ slug: SLUG, card_number: 42 }, ip))
      expect(r.status).toBe(200)
    }
    const blocked = await POST(makeRequest({ slug: SLUG, card_number: 42 }, ip))
    expect(blocked.status).toBe(429)
  })
})
