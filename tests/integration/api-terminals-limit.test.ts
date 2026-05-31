/**
 * Integration-Test: Terminal-Limit honoriert gekaufte Zusatz-Standorte.
 *
 * Vor Migration 007 brachte `extra_location` funktional NICHTS — der Kunde
 * zahlte, bekam aber keine zusätzliche Kapazität. Jetzt gilt:
 *   effektives Terminal-Limit = Basis-Limit des Plans + extra_location.quantity.
 *
 * Getestet wird die echte Route @/app/api/admin/terminals (GET + POST) mit
 * gemocktem getAdminContext und fetch.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { AdminContext } from '@/lib/admin-auth'

vi.mock('@/lib/admin-auth', () => ({ getAdminContext: vi.fn() }))

import { getAdminContext } from '@/lib/admin-auth'
import { GET, POST } from '@/app/api/admin/terminals/route'

const COMPANY_ID = 'company-123'
const mockedGetAdminContext = vi.mocked(getAdminContext)

function setAdmin(role: 'admin' | 'member' = 'admin') {
  const ctx: AdminContext = {
    accessToken: 'token-abc',
    userId: 'user-1',
    email: 'admin@test.de',
    name: 'Admin',
    role,
    company: { id: COMPANY_ID, name: 'Test Firma', slug: 'test-firma' },
  }
  mockedGetAdminContext.mockResolvedValue(ctx)
}

interface DbOpts {
  plan: 'solo' | 'business' | 'enterprise'
  terminalLimit: number | null
  extraLocationQty?: number   // 0 = nicht gekauft
  activeCount: number         // aktuell aktive Terminals
}

function mockDb({ plan, terminalLimit, extraLocationQty = 0, activeCount }: DbOpts) {
  global.fetch = vi.fn().mockImplementation(async (url: string | URL, init?: RequestInit) => {
    const u = url.toString()
    const method = init?.method ?? 'GET'

    if (u.includes('/rest/v1/companies')) {
      return new Response(JSON.stringify([{ plan, terminal_limit: terminalLimit, billing_cycle: 'monthly' }]), { status: 200 })
    }
    if (u.includes('/rest/v1/company_addons')) {
      const rows = extraLocationQty > 0
        ? [{ company_id: COMPANY_ID, addon_key: 'extra_location', stripe_subscription_item_id: 'si_x', billing_cycle: 'monthly', active_since: '2026-01-01T00:00:00Z', quantity: extraLocationQty }]
        : []
      return new Response(JSON.stringify(rows), { status: 200 })
    }
    if (u.includes('/rest/v1/terminals')) {
      if (method === 'POST') {
        return new Response(JSON.stringify([{ id: 't-new', name: 'Tor 2', slug: 'tor-2-ab12', is_active: true, sort_order: activeCount }]), { status: 201 })
      }
      // Count-Abfrage (Limit-Check)
      if (u.includes('is_active=eq.true&select=id')) {
        return new Response(JSON.stringify([]), { status: 200, headers: { 'content-range': `*/${activeCount}` } })
      }
      // sort_order-Liste vor dem Insert
      if (u.includes('order=sort_order.desc')) {
        return new Response(JSON.stringify([{ sort_order: Math.max(0, activeCount - 1) }]), { status: 200 })
      }
      // Haupt-Liste im GET-Handler
      return new Response(JSON.stringify([]), { status: 200 })
    }
    throw new Error(`Unmocked fetch: ${method} ${u}`)
  }) as unknown as typeof fetch
}

function postRequest(name = 'Tor 2'): NextRequest {
  return new NextRequest('http://test.local/api/admin/terminals', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  })
}

beforeEach(() => setAdmin())

describe('POST /api/admin/terminals — Limit ohne Zusatz-Standort', () => {
  it('blockt mit 403 plan_limit_reached, wenn das Basis-Limit erreicht ist', async () => {
    mockDb({ plan: 'business', terminalLimit: 3, activeCount: 3 })
    const res = await POST(postRequest())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('plan_limit_reached')
    expect(body.limit).toBe(3)
  })
})

describe('POST /api/admin/terminals — Zusatz-Standorte heben das Limit', () => {
  it('erlaubt das Anlegen über das Basis-Limit hinaus (+2 Einheiten → Limit 5, 3 belegt)', async () => {
    mockDb({ plan: 'business', terminalLimit: 3, extraLocationQty: 2, activeCount: 3 })
    const res = await POST(postRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.terminal?.id).toBe('t-new')
  })

  it('blockt erst am erhöhten Limit (Limit 5, 5 belegt → 403 mit limit=5)', async () => {
    mockDb({ plan: 'business', terminalLimit: 3, extraLocationQty: 2, activeCount: 5 })
    const res = await POST(postRequest())
    expect(res.status).toBe(403)
    expect((await res.json()).limit).toBe(5)
  })

  it('Enterprise (unbegrenzt) ignoriert Add-on-Mengen und blockt nie', async () => {
    mockDb({ plan: 'enterprise', terminalLimit: null, activeCount: 99 })
    const res = await POST(postRequest())
    expect(res.status).toBe(200)
  })
})

describe('GET /api/admin/terminals — Kapazitätsanzeige', () => {
  it('meldet das effektive Limit (Basis + Zusatz-Standorte)', async () => {
    mockDb({ plan: 'business', terminalLimit: 3, extraLocationQty: 2, activeCount: 1 })
    const res = await GET()
    expect(res.status).toBe(200)
    expect((await res.json()).terminal_limit).toBe(5)
  })
})
