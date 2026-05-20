/**
 * Integration-Test: echte POST /api/check-in Route
 *
 * Importiert den echten Handler aus @/app/api/check-in/route und ruft ihn mit
 * gemocktem fetch auf. Testet das Zusammenspiel von Zod-Validation, Rate Limit
 * und Supabase-Insert.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/check-in/route'

const SLUG = 'test-firma'
const COMPANY_ID = 'company-123'

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
