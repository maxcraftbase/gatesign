/**
 * Admin-API für die Print-Bridge-Verwaltung (Drucker-Add-on).
 *
 * GET    → Liste der Terminals der Firma inkl. gekoppelter Bridge (Status,
 *          last_seen, Drucker-Ziel/-Modell). Speist die Bridge-Status-Cards im Billing.
 * POST   → startet/erneuert das Pairing für ein Terminal: erzeugt einen 8-stelligen
 *          Code (10 min TTL), den der Kunde in der Bridge eintippt. Body: { terminal_id }
 *
 * Auth: getAdminContext() (eingeloggter Admin), Terminal muss zur Firma gehören.
 * Gate: nur wenn das Drucker-Add-on für die Firma aktiv ist.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminContext } from '@/lib/admin-auth'
import { listTerminals } from '@/lib/company'
import { hasAddon } from '@/lib/addons'
import { startPairing, type PrintBridge } from '@/lib/print-jobs'
import { supabaseUrl, sbServiceHeaders } from '@/lib/supabase-server'

interface TerminalBridge {
  terminal_id: string
  terminal_name: string
  bridge: {
    id: string
    paired: boolean
    status: PrintBridge['status']
    last_seen: string | null
    last_error: string | null
    printer_target: string | null
    printer_model: string | null
    pairing_active: boolean
    pairing_expires_at: string | null
  } | null
}

export async function GET() {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const printerActive = await hasAddon(ctx.company.id, 'printer')

  const terminals = await listTerminals(ctx.company.id)

  // Alle Bridges der Firma in einem Query holen und pro Terminal zuordnen.
  const res = await fetch(
    `${supabaseUrl}/rest/v1/print_bridges?company_id=eq.${encodeURIComponent(ctx.company.id)}` +
      `&select=id,terminal_id,status,last_seen,last_error,printer_target,printer_model,api_token_hash,pairing_code,pairing_expires_at`,
    { headers: sbServiceHeaders(), cache: 'no-store' },
  )
  type BridgeRow = {
    id: string
    terminal_id: string
    status: PrintBridge['status']
    last_seen: string | null
    last_error: string | null
    printer_target: string | null
    printer_model: string | null
    api_token_hash: string | null
    pairing_code: string | null
    pairing_expires_at: string | null
  }
  const bridges: BridgeRow[] = res.ok ? await res.json() : []
  const byTerminal = new Map(bridges.map(b => [b.terminal_id, b]))

  const nowMs = Date.now()
  const result: TerminalBridge[] = terminals
    .filter(t => t.is_active)
    .map(t => {
      const b = byTerminal.get(t.id)
      return {
        terminal_id: t.id,
        terminal_name: t.name,
        bridge: b
          ? {
              id: b.id,
              paired: Boolean(b.api_token_hash),
              status: b.status,
              last_seen: b.last_seen,
              last_error: b.last_error,
              printer_target: b.printer_target,
              printer_model: b.printer_model,
              pairing_active:
                Boolean(b.pairing_code) &&
                Boolean(b.pairing_expires_at) &&
                new Date(b.pairing_expires_at!).getTime() > nowMs,
              pairing_expires_at: b.pairing_expires_at,
            }
          : null,
      }
    })

  return NextResponse.json({ printerActive, terminals: result })
}

const postSchema = z.object({
  terminal_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const printerActive = await hasAddon(ctx.company.id, 'printer')
  if (!printerActive) {
    return NextResponse.json(
      { error: 'Das Drucker-Add-on ist für diese Firma nicht aktiv.' },
      { status: 403 },
    )
  }

  const parsed = postSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })
  }

  // Terminal muss zur Firma des Admins gehören (kein Cross-Tenant-Pairing).
  const terminals = await listTerminals(ctx.company.id)
  const terminal = terminals.find(t => t.id === parsed.data.terminal_id)
  if (!terminal) {
    return NextResponse.json({ error: 'Terminal nicht gefunden' }, { status: 404 })
  }

  try {
    const { pairingCode, expiresAt } = await startPairing({
      companyId: ctx.company.id,
      terminalId: terminal.id,
      displayName: terminal.name,
    })
    return NextResponse.json({ pairing_code: pairingCode, expires_at: expiresAt })
  } catch (err) {
    console.error('[admin/print-bridge] Pairing-Start fehlgeschlagen:', err)
    return NextResponse.json({ error: 'Pairing konnte nicht gestartet werden.' }, { status: 500 })
  }
}
