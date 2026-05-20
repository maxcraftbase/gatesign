/**
 * Integration-Test: DELETE /api/admin/entries/[id]
 *
 * Testet das Zusammenspiel von Auth, Company-Isolation, Rate-Limit und
 * Supabase-Delete für den DSGVO-Art-17-Endpoint (Recht auf Löschung).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// admin-auth muss gemockt werden, damit wir den Auth-Context kontrollieren
vi.mock('@/lib/admin-auth', () => ({
  getAdminContext: vi.fn(),
}))

// audit-log: wir wollen nur prüfen dass es aufgerufen wird, kein echter Insert
vi.mock('@/lib/audit', () => ({
  logAction: vi.fn(async () => undefined),
}))

import { DELETE } from '@/app/api/admin/entries/[id]/route'
import { getAdminContext } from '@/lib/admin-auth'
import { logAction } from '@/lib/audit'

const COMPANY_ID = 'company-123'
const OTHER_COMPANY_ID = 'company-other'
const ENTRY_ID = 'entry-abc'

function adminContext(role: 'admin' | 'member' = 'admin') {
  return {
    accessToken: 'tok',
    userId: 'user-1',
    email: 'admin@test.de',
    name: 'Max Admin',
    role,
    company: { id: COMPANY_ID, name: 'Test GmbH', slug: 'test' },
  }
}

function makeRequest(): NextRequest {
  return new NextRequest('http://test.local/api/admin/entries/' + ENTRY_ID, { method: 'DELETE' })
}

const params = Promise.resolve({ id: ENTRY_ID })

function mockSupabaseHappyPath() {
  global.fetch = vi.fn().mockImplementation(async (url: string | URL, init?: RequestInit) => {
    const u = url.toString()
    if (u.includes('/rest/v1/check_ins') && (!init?.method || init.method === 'GET')) {
      // Company-Isolation-Check: Entry gehört zu COMPANY_ID
      return new Response(JSON.stringify([{ id: ENTRY_ID, driver_name: 'Max Mustermann' }]), {
        status: 200,
      })
    }
    if (u.includes('/rest/v1/check_ins') && init?.method === 'DELETE') {
      return new Response(null, { status: 204 })
    }
    throw new Error(`Unmocked fetch: ${u} (method=${init?.method})`)
  }) as unknown as typeof fetch
}

describe('DELETE /api/admin/entries/[id]', () => {
  beforeEach(() => {
    mockSupabaseHappyPath()
  })

  it('löscht Eintrag bei Admin + eigener Company', async () => {
    vi.mocked(getAdminContext).mockResolvedValue(adminContext('admin'))

    const res = await DELETE(makeRequest(), { params })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ success: true })
    expect(logAction).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'admin' }),
      'entry_deleted',
      expect.objectContaining({ entry_id: ENTRY_ID, driver_name: 'Max Mustermann' }),
    )
  })

  it('returnt 401 ohne Auth-Context', async () => {
    vi.mocked(getAdminContext).mockResolvedValue(null)

    const res = await DELETE(makeRequest(), { params })

    expect(res.status).toBe(401)
    expect(logAction).not.toHaveBeenCalled()
  })

  it('returnt 403 für Member (nur Admin darf löschen)', async () => {
    vi.mocked(getAdminContext).mockResolvedValue(adminContext('member'))

    const res = await DELETE(makeRequest(), { params })

    expect(res.status).toBe(403)
    expect(logAction).not.toHaveBeenCalled()
  })

  it('returnt 404 wenn Entry NICHT in eigener Company ist (Isolation)', async () => {
    vi.mocked(getAdminContext).mockResolvedValue(adminContext('admin'))
    // Supabase liefert leeres Array → Entry gehört zu anderer Firma oder existiert nicht
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    ) as unknown as typeof fetch

    const res = await DELETE(makeRequest(), { params })

    expect(res.status).toBe(404)
    expect(logAction).not.toHaveBeenCalled()
  })

  it('returnt 500 wenn Supabase-DELETE scheitert', async () => {
    vi.mocked(getAdminContext).mockResolvedValue(adminContext('admin'))
    global.fetch = vi.fn().mockImplementation(async (url: string | URL, init?: RequestInit) => {
      const u = url.toString()
      if (u.includes('/rest/v1/check_ins') && (!init?.method || init.method === 'GET')) {
        return new Response(JSON.stringify([{ id: ENTRY_ID, driver_name: 'X' }]), { status: 200 })
      }
      return new Response('boom', { status: 500 })
    }) as unknown as typeof fetch

    const res = await DELETE(makeRequest(), { params })

    expect(res.status).toBe(500)
    expect(logAction).not.toHaveBeenCalled()
  })

  // Smoke-Test für Company-Isolation: Entry-ID einer FREMDEN Company läuft eh über
  // den 404-Pfad ab (Supabase liefert leeres Array, weil company_id-Filter greift).
  // Wir setzen das hier nochmal explizit:
  it('verhindert cross-company Löschung (auch bei korrektem Entry-ID-Format)', async () => {
    vi.mocked(getAdminContext).mockResolvedValue(adminContext('admin'))
    // Fetch-Mock: wenn URL company_id der eigenen company hat → leer (Entry gehört zu anderer)
    global.fetch = vi.fn().mockImplementation(async (url: string | URL) => {
      const u = url.toString()
      // Filter auf eigene Company greift → leeres Resultat
      if (u.includes(`company_id=eq.${COMPANY_ID}`)) {
        return new Response(JSON.stringify([]), { status: 200 })
      }
      throw new Error(`Unexpected fetch: ${u}`)
    }) as unknown as typeof fetch

    const res = await DELETE(makeRequest(), { params })

    expect(res.status).toBe(404)
    // Es darf KEIN DELETE-Call gemacht worden sein
    const fetchCalls = vi.mocked(global.fetch).mock.calls
    const deleteCalls = fetchCalls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'DELETE')
    expect(deleteCalls.length).toBe(0)
  })

  // Reference: OTHER_COMPANY_ID is documented for clarity but not directly used,
  // since Supabase's company_id filter does the actual isolation.
  void OTHER_COMPANY_ID
})
