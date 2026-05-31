/**
 * Unit-Tests: src/lib/print-jobs.ts — Print-Bridge DB-Layer.
 *
 * Schwerpunkt liegt auf den sicherheits- und korrektheitskritischen Teilen:
 *  - Token-Hashing + Bearer-Parsing
 *  - authenticateBridge (O(1)-Hash-Lookup, kein Token-Material in Logs)
 *  - pickUpNextJob (atomarer Pickup, Race blockt Doppeldruck)
 *  - reportJobStatus (Pickup-Token muss matchen)
 *  - allocateCardNumber (RPC-Rückgabe robust parsen)
 *
 * Supabase wird über global.fetch gemockt.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generatePairingCode,
  generateApiToken,
  hashApiToken,
  extractBearerToken,
  authenticateBridge,
  startPairing,
  pickUpNextJob,
  reportJobStatus,
  allocateCardNumber,
} from '@/lib/print-jobs'

const PAIRING_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const SAMPLE_BRIDGE = {
  id: 'bridge-1',
  company_id: 'company-1',
  terminal_id: 'terminal-1',
  display_name: 'Tor Nord',
  printer_target: 'usb://0x04f9:0x209d',
  printer_model: 'QL-820NWB',
  status: 'online',
  last_seen: null,
  last_error: null,
}

const SAMPLE_JOB = {
  id: 'job-1',
  bridge_id: 'bridge-1',
  check_in_id: 'check-in-1',
  png_base64: 'iVBORw0KGgo=',
  status: 'pending',
  pickup_token: null,
  created_at: '2026-05-31T08:00:00Z',
  picked_up_at: null,
  completed_at: null,
  error_message: null,
}

describe('Code- / Token-Generierung', () => {
  it('generatePairingCode: 8 Zeichen, nur aus dem verwechslungssicheren Charset', () => {
    for (let i = 0; i < 50; i++) {
      const code = generatePairingCode()
      expect(code).toHaveLength(8)
      for (const ch of code) expect(PAIRING_CHARS).toContain(ch)
    }
  })

  it('generateApiToken: UUID-v4-Format', () => {
    expect(generateApiToken()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('hashApiToken: deterministischer 64-stelliger Hex-SHA-256', () => {
    const h1 = hashApiToken('token-abc')
    const h2 = hashApiToken('token-abc')
    expect(h1).toBe(h2)
    expect(h1).toMatch(/^[0-9a-f]{64}$/)
    expect(hashApiToken('token-xyz')).not.toBe(h1)
  })
})

describe('extractBearerToken', () => {
  it('parst "Bearer <token>"', () => {
    expect(extractBearerToken('Bearer abc123')).toBe('abc123')
  })
  it('ist case-insensitive', () => {
    expect(extractBearerToken('bearer abc123')).toBe('abc123')
  })
  it('trimmt Whitespace', () => {
    expect(extractBearerToken('Bearer   abc123  ')).toBe('abc123')
  })
  it('returnt null bei fehlendem/falschem Schema', () => {
    expect(extractBearerToken(null)).toBeNull()
    expect(extractBearerToken('Basic abc')).toBeNull()
    expect(extractBearerToken('abc123')).toBeNull()
  })
})

describe('authenticateBridge', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation(async (url: string | URL) => {
      const u = url.toString()
      // Lookup auf api_token_hash → eine Bridge zurückgeben
      if (u.includes('api_token_hash=eq.')) return new Response(JSON.stringify([SAMPLE_BRIDGE]), { status: 200 })
      // Heartbeat-PATCH (fire-and-forget)
      return new Response(null, { status: 204 })
    }) as unknown as typeof fetch
  })

  it('returnt null ohne Token und ruft fetch NICHT auf', async () => {
    const spy = vi.fn()
    global.fetch = spy as unknown as typeof fetch
    expect(await authenticateBridge(null)).toBeNull()
    expect(await authenticateBridge('')).toBeNull()
    expect(spy).not.toHaveBeenCalled()
  })

  it('liefert die Bridge bei passendem Hash-Lookup', async () => {
    const bridge = await authenticateBridge('valid-token')
    expect(bridge?.id).toBe('bridge-1')
  })

  it('lookt per indexiertem Hash, nicht per Plaintext-Token', async () => {
    await authenticateBridge('super-secret-token')
    const lookupCall = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls
      .map(c => String(c[0]))
      .find(u => u.includes('api_token_hash=eq.'))
    expect(lookupCall).toBeDefined()
    expect(lookupCall).toContain(hashApiToken('super-secret-token'))
    expect(lookupCall).not.toContain('super-secret-token')
  })

  it('returnt null, wenn kein Hash matcht', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 })) as unknown as typeof fetch
    expect(await authenticateBridge('unknown-token')).toBeNull()
  })
})

describe('startPairing — Upsert auf terminal_id-Constraint', () => {
  function mockPostOk() {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }))
    global.fetch = fetchMock as unknown as typeof fetch
    return fetchMock
  }

  it('postet auf print_bridges mit on_conflict=terminal_id (mergt statt zu kollidieren)', async () => {
    const fetchMock = mockPostOk()
    await startPairing({ companyId: 'company-1', terminalId: 'terminal-1', displayName: 'Tor Nord' })

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/rest/v1/print_bridges')
    expect(String(url)).toContain('on_conflict=terminal_id')
    expect(init?.method).toBe('POST')
    expect(String((init?.headers as Record<string, string>).Prefer)).toContain('resolution=merge-duplicates')
  })

  it('nutzt bei wiederholtem Pairing desselben Terminals erneut on_conflict=terminal_id (kein 409)', async () => {
    const fetchMock = mockPostOk()
    await startPairing({ companyId: 'company-1', terminalId: 'terminal-1' })
    await startPairing({ companyId: 'company-1', terminalId: 'terminal-1' })

    expect(fetchMock.mock.calls).toHaveLength(2)
    for (const [url] of fetchMock.mock.calls) {
      expect(String(url)).toContain('on_conflict=terminal_id')
    }
  })

  it('gibt frischen Code + Ablaufzeit zurück und resettet api_token_hash im Body', async () => {
    const fetchMock = mockPostOk()
    const { pairingCode, expiresAt } = await startPairing({ companyId: 'company-1', terminalId: 'terminal-1' })

    expect(pairingCode).toHaveLength(8)
    expect(Number.isNaN(Date.parse(expiresAt))).toBe(false)

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]!.body))
    expect(body.terminal_id).toBe('terminal-1')
    expect(body.api_token_hash).toBeNull()
    expect(body.status).toBe('offline')
  })

  it('wirft, wenn PostgREST den Upsert ablehnt', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('conflict', { status: 409 })) as unknown as typeof fetch
    await expect(startPairing({ companyId: 'company-1', terminalId: 'terminal-1' })).rejects.toThrow()
  })
})

describe('pickUpNextJob — atomarer Pickup', () => {
  it('returnt null, wenn kein pending-Job existiert', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 })) as unknown as typeof fetch
    expect(await pickUpNextJob('bridge-1')).toBeNull()
  })

  it('claimt den ältesten Job und setzt status=sent + pickup_token', async () => {
    global.fetch = vi.fn().mockImplementation(async (_url: string | URL, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      if (method === 'PATCH') {
        const body = JSON.parse(String(init!.body))
        return new Response(JSON.stringify([{ ...SAMPLE_JOB, ...body }]), { status: 200 })
      }
      return new Response(JSON.stringify([SAMPLE_JOB]), { status: 200 })
    }) as unknown as typeof fetch

    const job = await pickUpNextJob('bridge-1')
    expect(job?.id).toBe('job-1')
    expect(job?.status).toBe('sent')
    expect(typeof job?.pickup_token).toBe('string')
    expect(job?.pickup_token).toHaveLength(36) // UUID
  })

  it('returnt null, wenn der conditional Claim 0 Zeilen trifft (Race → kein Doppeldruck)', async () => {
    global.fetch = vi.fn().mockImplementation(async (_url: string | URL, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      // Ein anderer Pickup war schneller: status ist nicht mehr 'pending' → PATCH matcht 0 Zeilen
      if (method === 'PATCH') return new Response(JSON.stringify([]), { status: 200 })
      return new Response(JSON.stringify([SAMPLE_JOB]), { status: 200 })
    }) as unknown as typeof fetch

    expect(await pickUpNextJob('bridge-1')).toBeNull()
  })

  it('der Claim-PATCH ist auf status=pending konditioniert', async () => {
    const fetchMock = vi.fn().mockImplementation(async (_url: string | URL, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      if (method === 'PATCH') return new Response(JSON.stringify([{ ...SAMPLE_JOB, status: 'sent' }]), { status: 200 })
      return new Response(JSON.stringify([SAMPLE_JOB]), { status: 200 })
    })
    global.fetch = fetchMock as unknown as typeof fetch
    await pickUpNextJob('bridge-1')
    const patchUrl = fetchMock.mock.calls.map(c => String(c[0])).find((_u, i) => fetchMock.mock.calls[i][1]?.method === 'PATCH')
    expect(patchUrl).toContain('status=eq.pending')
  })
})

describe('reportJobStatus — Pickup-Token muss matchen', () => {
  it('returnt true, wenn genau eine Zeile aktualisiert wurde', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: 'job-1' }]), { status: 200 })) as unknown as typeof fetch
    const ok = await reportJobStatus({ jobId: 'job-1', pickupToken: 'tok', status: 'printed' })
    expect(ok).toBe(true)
  })

  it('returnt false bei falschem Token (0 Zeilen aktualisiert)', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 })) as unknown as typeof fetch
    const ok = await reportJobStatus({ jobId: 'job-1', pickupToken: 'falsch', status: 'printed' })
    expect(ok).toBe(false)
  })

  it('returnt false, wenn der Request scheitert', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('err', { status: 500 })) as unknown as typeof fetch
    expect(await reportJobStatus({ jobId: 'job-1', pickupToken: 'tok', status: 'failed', errorMessage: 'paper_out' })).toBe(false)
  })
})

describe('allocateCardNumber — RPC-Rückgabe robust parsen', () => {
  it('parst eine JSON-Number', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('5', { status: 200 })) as unknown as typeof fetch
    expect(await allocateCardNumber({ companyId: 'c', terminalId: 't', cardDate: '2026-05-31' })).toBe(5)
  })

  it('parst einen numerischen String', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('"7"', { status: 200 })) as unknown as typeof fetch
    expect(await allocateCardNumber({ companyId: 'c', terminalId: 't', cardDate: '2026-05-31' })).toBe(7)
  })

  it('returnt null bei nicht-numerischer Rückgabe', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('null', { status: 200 })) as unknown as typeof fetch
    expect(await allocateCardNumber({ companyId: 'c', terminalId: 't', cardDate: '2026-05-31' })).toBeNull()
  })

  it('returnt null, wenn die RPC scheitert', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('err', { status: 500 })) as unknown as typeof fetch
    expect(await allocateCardNumber({ companyId: 'c', terminalId: 't', cardDate: '2026-05-31' })).toBeNull()
  })
})
