/**
 * Integration-Tests: Print-Job-Wartungs-Crons (Reaper + Cleanup).
 *
 * Beide laufen über das x-cron-secret-Auth-Pattern und sprechen Supabase direkt
 * an. Geprüft werden: Auth-Gate, korrekter Filter/Method gegen PostgREST und die
 * zurückgemeldete Anzahl betroffener Zeilen.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as reaperPOST } from '@/app/api/cron/reaper-print-jobs/route'
import { POST as cleanupPOST } from '@/app/api/cron/cleanup-print-jobs/route'

const SECRET = 'test-cron-secret' // entspricht tests/setup.ts

function makeRequest(secret?: string): NextRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (secret) headers['x-cron-secret'] = secret
  return new NextRequest('http://test.local/api/cron/x', { method: 'POST', headers })
}

interface Capture { url: string; method: string; body: unknown }
let calls: Capture[] = []

function mockSupabase(rows: unknown[] = [{ id: 'job-1' }, { id: 'job-2' }], status = 200) {
  calls = []
  global.fetch = vi.fn().mockImplementation(async (url: string | URL, init?: RequestInit) => {
    let body: unknown
    try { body = init?.body ? JSON.parse(String(init.body)) : undefined } catch { body = init?.body }
    calls.push({ url: url.toString(), method: init?.method ?? 'GET', body })
    return new Response(JSON.stringify(rows), { status })
  }) as unknown as typeof fetch
}

describe('POST /api/cron/reaper-print-jobs', () => {
  beforeEach(() => { mockSupabase() })

  it('returnt 401 ohne x-cron-secret', async () => {
    expect((await reaperPOST(makeRequest())).status).toBe(401)
  })

  it('returnt 401 bei falschem secret', async () => {
    expect((await reaperPOST(makeRequest('falsch'))).status).toBe(401)
  })

  it('markiert hängende sent-Jobs als failed und gibt die Anzahl zurück', async () => {
    const res = await reaperPOST(makeRequest(SECRET))
    expect(res.status).toBe(200)
    expect((await res.json()).reaped).toBe(2)

    const patch = calls[0]
    expect(patch.method).toBe('PATCH')
    expect(patch.url).toContain('/rest/v1/print_jobs')
    expect(patch.url).toContain('status=eq.sent')
    expect(patch.url).toContain('picked_up_at=lt.')
    expect((patch.body as Record<string, unknown>).status).toBe('failed')
    expect((patch.body as Record<string, unknown>).error_message).toBe('reaper_timeout')
  })

  it('returnt 500, wenn Supabase scheitert', async () => {
    mockSupabase([], 500)
    expect((await reaperPOST(makeRequest(SECRET))).status).toBe(500)
  })
})

describe('POST /api/cron/cleanup-print-jobs', () => {
  beforeEach(() => { mockSupabase() })

  it('returnt 401 ohne x-cron-secret', async () => {
    expect((await cleanupPOST(makeRequest())).status).toBe(401)
  })

  it('löscht Jobs älter als 24h und gibt die Anzahl zurück', async () => {
    const res = await cleanupPOST(makeRequest(SECRET))
    expect(res.status).toBe(200)
    expect((await res.json()).deleted).toBe(2)

    const del = calls[0]
    expect(del.method).toBe('DELETE')
    expect(del.url).toContain('/rest/v1/print_jobs')
    expect(del.url).toContain('created_at=lt.')
  })

  it('returnt 500, wenn Supabase scheitert', async () => {
    mockSupabase([], 500)
    expect((await cleanupPOST(makeRequest(SECRET))).status).toBe(500)
  })
})
