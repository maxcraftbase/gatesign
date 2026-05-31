/**
 * Print-Bridge DB-Layer.
 *
 * Kapselt alle Supabase-Calls rund um print_bridges und print_jobs:
 * Pairing (Code-Generierung, Code-Tausch → API-Token), Job-Queue (atomic pickup,
 * Status-Updates), Heartbeat. Wird von den /api/print-agent/* Routes konsumiert.
 *
 * API-Token: einmalig beim Pairing als Plaintext zurückgegeben, ab dann nur
 * SHA-256-Hash in der DB. Verifikation per indexiertem Direkt-Lookup auf den Hash.
 * (Kein bcrypt: der Token ist ein 128-bit-Random-UUID, kein Low-Entropy-Passwort —
 *  SHA-256 ohne Salt ist hier ausreichend sicher UND erlaubt einen O(1)-Lookup
 *  statt einen O(n)-Scan über alle Bridges.)
 */

import crypto from 'node:crypto'
import { supabaseUrl, sbServiceHeaders } from './supabase-server'

// ─────────────────────────────────────────────────────────────────────────────
// Konstanten
// ─────────────────────────────────────────────────────────────────────────────

/** TTL für Pairing-Codes — danach automatisch ungültig. */
const PAIRING_TTL_MIN = 10

/** Charset für Pairing-Codes (verwechslungssicher: kein 0/O, kein 1/I/L). */
const PAIRING_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Länge des Pairing-Codes. */
const PAIRING_CODE_LENGTH = 8

// ─────────────────────────────────────────────────────────────────────────────
// Typen
// ─────────────────────────────────────────────────────────────────────────────

export type BridgeStatus = 'offline' | 'online' | 'paper_out' | 'error'
export type JobStatus    = 'pending' | 'sent' | 'printed' | 'failed'

export interface PrintBridge {
  id: string
  company_id: string
  terminal_id: string
  display_name: string | null
  printer_target: string | null
  printer_model: string
  status: BridgeStatus
  last_seen: string | null
  last_error: string | null
}

export interface PrintJob {
  id: string
  bridge_id: string
  check_in_id: string
  png_base64: string
  status: JobStatus
  pickup_token: string | null
  created_at: string
  picked_up_at: string | null
  completed_at: string | null
  error_message: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Code- / Token-Generierung
// ─────────────────────────────────────────────────────────────────────────────

/** Generiert einen Pairing-Code (8 alphanumerische Zeichen, verwechslungssicher). */
export function generatePairingCode(): string {
  const buf = crypto.randomBytes(PAIRING_CODE_LENGTH)
  let code = ''
  for (let i = 0; i < PAIRING_CODE_LENGTH; i++) {
    code += PAIRING_CHARS[buf[i] % PAIRING_CHARS.length]
  }
  return code
}

/** Generiert einen API-Token (UUID v4, 128 bit Entropie). */
export function generateApiToken(): string {
  return crypto.randomUUID()
}

/**
 * Hasht einen API-Token für die Speicherung/den Lookup.
 * SHA-256 (hex). Ausreichend, weil der Token selbst hohe Entropie hat (UUID v4)
 * — kein Salt/bcrypt nötig, und deterministisch → indexierter Direkt-Lookup möglich.
 */
export function hashApiToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// ─────────────────────────────────────────────────────────────────────────────
// Bridge-Lookup
// ─────────────────────────────────────────────────────────────────────────────

export async function getBridgeByTerminalId(terminalId: string): Promise<PrintBridge | null> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/print_bridges?terminal_id=eq.${encodeURIComponent(terminalId)}&select=*&limit=1`,
    { headers: sbServiceHeaders(), cache: 'no-store' },
  )
  if (!res.ok) return null
  const rows: PrintBridge[] = await res.json()
  return rows[0] ?? null
}

export async function getBridgeById(bridgeId: string): Promise<PrintBridge | null> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/print_bridges?id=eq.${encodeURIComponent(bridgeId)}&select=*&limit=1`,
    { headers: sbServiceHeaders(), cache: 'no-store' },
  )
  if (!res.ok) return null
  const rows: PrintBridge[] = await res.json()
  return rows[0] ?? null
}

/** Lookup für Pairing — alle Bridges mit nicht-abgelaufenem Code. */
async function findBridgesWithPairingCode(): Promise<Array<PrintBridge & { pairing_code: string; pairing_expires_at: string }>> {
  const nowIso = encodeURIComponent(new Date().toISOString())
  const res = await fetch(
    `${supabaseUrl}/rest/v1/print_bridges?pairing_code=not.is.null&pairing_expires_at=gt.${nowIso}&select=*`,
    { headers: sbServiceHeaders(), cache: 'no-store' },
  )
  if (!res.ok) return []
  return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// Pairing-Flow
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initiiert das Pairing für einen Terminal: erstellt (oder updated) eine Bridge-Zeile
 * mit frischem Pairing-Code (TTL 10 min) und löscht ggf. den alten api_token_hash.
 * Wird vom Admin aufgerufen.
 */
export async function startPairing(opts: {
  companyId: string
  terminalId: string
  displayName?: string
}): Promise<{ pairingCode: string; expiresAt: string }> {
  const pairingCode = generatePairingCode()
  const expiresAt = new Date(Date.now() + PAIRING_TTL_MIN * 60_000).toISOString()

  const row = {
    company_id: opts.companyId,
    terminal_id: opts.terminalId,
    display_name: opts.displayName ?? null,
    pairing_code: pairingCode,
    pairing_expires_at: expiresAt,
    api_token_hash: null,           // reset: bisherige Bridge muss neu pairen
    status: 'offline' as BridgeStatus,
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/print_bridges`, {
    method: 'POST',
    headers: {
      ...sbServiceHeaders(),
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  })

  if (!res.ok) {
    throw new Error(`Pairing-Start fehlgeschlagen: ${res.status} ${await res.text()}`)
  }
  return { pairingCode, expiresAt }
}

/**
 * Tauscht einen Pairing-Code gegen einen API-Token. Aufruf vom Bridge-Service
 * beim ersten Start. Pairing-Code wird verbraucht (gelöscht), API-Token-Hash
 * wird persistiert.
 */
export async function completePairing(opts: {
  pairingCode: string
  printerTarget: string
  printerModel?: string
}): Promise<{ apiToken: string; bridge: PrintBridge } | { error: 'invalid_or_expired' }> {
  const candidates = await findBridgesWithPairingCode()
  const bridge = candidates.find(b => b.pairing_code === opts.pairingCode)
  if (!bridge) return { error: 'invalid_or_expired' }

  const apiToken = generateApiToken()
  const apiTokenHash = hashApiToken(apiToken)

  const patch = {
    pairing_code: null,
    pairing_expires_at: null,
    api_token_hash: apiTokenHash,
    printer_target: opts.printerTarget,
    printer_model: opts.printerModel ?? 'QL-820NWB',
    status: 'online' as BridgeStatus,
    last_seen: new Date().toISOString(),
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/print_bridges?id=eq.${bridge.id}`,
    {
      method: 'PATCH',
      headers: {
        ...sbServiceHeaders(),
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(patch),
    },
  )
  if (!res.ok) {
    return { error: 'invalid_or_expired' }
  }
  const updated: PrintBridge[] = await res.json()
  return { apiToken, bridge: updated[0] }
}

// ─────────────────────────────────────────────────────────────────────────────
// Authentifizierung
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifiziert einen Bearer-Token via indexiertem SHA-256-Lookup.
 * O(1): ein Query auf den (indexierten) api_token_hash statt Scan + bcrypt-Loop.
 * Der Hash-Vergleich findet in Postgres statt — kein Token-Material verlässt die DB.
 */
export async function authenticateBridge(token: string | null): Promise<PrintBridge | null> {
  if (!token) return null

  const tokenHash = hashApiToken(token)
  const res = await fetch(
    `${supabaseUrl}/rest/v1/print_bridges?api_token_hash=eq.${tokenHash}&select=*&limit=1`,
    { headers: sbServiceHeaders(), cache: 'no-store' },
  )
  if (!res.ok) return null
  const rows: PrintBridge[] = await res.json()
  const bridge = rows[0]
  if (!bridge) return null

  // Heartbeat-Update: last_seen → now (fire-and-forget, blockt Auth nicht)
  void fetch(
    `${supabaseUrl}/rest/v1/print_bridges?id=eq.${bridge.id}`,
    {
      method: 'PATCH',
      headers: {
        ...sbServiceHeaders(),
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ last_seen: new Date().toISOString() }),
    },
  ).catch(() => {})

  return bridge
}

/** Extrahiert Bearer-Token aus dem Authorization-Header. */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

// ─────────────────────────────────────────────────────────────────────────────
// Tagesnummer-Vergabe (Postgres-Function via RPC)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ruft die Postgres-Function allocate_card_number() auf — atomare Vergabe der
 * nächsten Tagesnummer für (company, terminal, date). Bei einer Lücke (z.B. weil
 * ein anderer Insert failed) bleibt die Nummer-Sequenz weiterlaufend; das ist
 * laut Plan akzeptabel.
 *
 * Datum wird explizit übergeben — der Caller muss garantieren, dass dasselbe
 * Datum auch als check_ins.card_date gesetzt wird (vermeidet Tagesübergangs-Bug).
 */
export async function allocateCardNumber(opts: {
  companyId: string
  terminalId: string
  cardDate: string  // ISO date 'YYYY-MM-DD'
}): Promise<number | null> {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/allocate_card_number`, {
    method: 'POST',
    headers: {
      ...sbServiceHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_company: opts.companyId,
      p_terminal: opts.terminalId,
      p_date: opts.cardDate,
    }),
  })
  if (!res.ok) return null
  // Postgres-Function gibt int direkt zurück → JSON-Number
  const value = await res.json() as number | string | null
  if (typeof value === 'number') return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number.parseInt(value, 10)
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Print-Job-Queue
// ─────────────────────────────────────────────────────────────────────────────

/** Legt einen Druckjob in die Queue. Wird von /api/check-in nach erfolgreichem Insert aufgerufen. */
export async function createPrintJob(opts: {
  bridgeId: string
  checkInId: string
  pngBase64: string
}): Promise<{ id: string } | null> {
  const res = await fetch(`${supabaseUrl}/rest/v1/print_jobs`, {
    method: 'POST',
    headers: {
      ...sbServiceHeaders(),
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      bridge_id: opts.bridgeId,
      check_in_id: opts.checkInId,
      png_base64: opts.pngBase64,
      status: 'pending',
    }),
  })
  if (!res.ok) return null
  const rows: { id: string }[] = await res.json()
  return rows[0] ?? null
}

/**
 * Atomic Pickup: holt den ältesten pending-Job für eine Bridge und markiert ihn
 * als 'sent' mit einem Idempotency-Token. Bei Bridge-Restart kann der nächste
 * GET einen anderen pickup_token erzeugen → kein Doppeldruck.
 *
 * Realisiert via PostgREST: zwei Calls in einer Transaktion sind hier nicht möglich,
 * also nutzen wir UPDATE mit WHERE-Subquery (atomar auf Postgres-Ebene).
 */
export async function pickUpNextJob(bridgeId: string): Promise<PrintJob | null> {
  const pickupToken = crypto.randomUUID()

  // Pattern: UPDATE print_jobs SET status='sent', picked_up_at=now(), pickup_token=$1
  // WHERE id = (SELECT id FROM print_jobs WHERE bridge_id=$2 AND status='pending' ORDER BY created_at LIMIT 1)
  // RETURNING *
  //
  // PostgREST kann das nicht direkt — wir nutzen RPC oder zwei Calls mit
  // Optimistic Concurrency. Hier: zwei Calls mit ?status=eq.pending Bedingung
  // im UPDATE (so können wir keine Race haben, weil 'pending' nur einmal exists).
  const findRes = await fetch(
    `${supabaseUrl}/rest/v1/print_jobs?bridge_id=eq.${bridgeId}&status=eq.pending&order=created_at.asc&limit=1&select=*`,
    { headers: sbServiceHeaders(), cache: 'no-store' },
  )
  if (!findRes.ok) return null
  const jobs: PrintJob[] = await findRes.json()
  if (jobs.length === 0) return null
  const job = jobs[0]

  // Conditional UPDATE: nur wenn status noch 'pending' ist (Optimistic Lock)
  const claimRes = await fetch(
    `${supabaseUrl}/rest/v1/print_jobs?id=eq.${job.id}&status=eq.pending`,
    {
      method: 'PATCH',
      headers: {
        ...sbServiceHeaders(),
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        status: 'sent',
        picked_up_at: new Date().toISOString(),
        pickup_token: pickupToken,
      }),
    },
  )
  if (!claimRes.ok) return null
  const claimed: PrintJob[] = await claimRes.json()
  if (claimed.length === 0) return null  // andere Bridge war schneller (Race)
  return claimed[0]
}

/**
 * Bridge meldet Job-Status. Pickup-Token muss matchen, sonst 403.
 */
export async function reportJobStatus(opts: {
  jobId: string
  pickupToken: string
  status: 'printed' | 'failed'
  errorMessage?: string
}): Promise<boolean> {
  const patch: Record<string, unknown> = {
    status: opts.status,
    completed_at: new Date().toISOString(),
  }
  if (opts.errorMessage) patch.error_message = opts.errorMessage

  // return=representation, damit wir die Zeilenanzahl prüfen können:
  // bei falschem jobId/pickup_token matcht 0 Zeilen → wir melden false (→ 403),
  // statt fälschlich Erfolg zu signalisieren.
  const res = await fetch(
    `${supabaseUrl}/rest/v1/print_jobs?id=eq.${opts.jobId}&pickup_token=eq.${opts.pickupToken}&select=id`,
    {
      method: 'PATCH',
      headers: {
        ...sbServiceHeaders(),
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(patch),
    },
  )
  if (!res.ok) return false
  const updated: { id: string }[] = await res.json()
  return updated.length > 0
}

// ─────────────────────────────────────────────────────────────────────────────
// Bridge-Status-Updates
// ─────────────────────────────────────────────────────────────────────────────

export async function updateBridgeStatus(opts: {
  bridgeId: string
  status: BridgeStatus
  lastError?: string | null
}): Promise<void> {
  const patch: Record<string, unknown> = {
    status: opts.status,
    last_seen: new Date().toISOString(),
  }
  if (opts.lastError !== undefined) patch.last_error = opts.lastError

  await fetch(`${supabaseUrl}/rest/v1/print_bridges?id=eq.${opts.bridgeId}`, {
    method: 'PATCH',
    headers: {
      ...sbServiceHeaders(),
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  })
}
