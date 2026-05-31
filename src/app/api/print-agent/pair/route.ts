/**
 * POST /api/print-agent/pair
 *
 * Bridge-Pairing: nimmt einen 8-stelligen Pairing-Code (vom Admin in der UI angezeigt),
 * tauscht ihn gegen einen persistenten API-Token. Der Token wird einmalig im Klartext
 * zurückgegeben, ab dann nur als SHA-256-Hash in der DB.
 *
 * Body:  { code, printer_target, printer_model? }
 * Rück:  { api_token, bridge_id, terminal_id }  | 400/401
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'
import { completePairing } from '@/lib/print-jobs'

const bodySchema = z.object({
  code: z.string().length(8).regex(/^[A-Z0-9]+$/),
  printer_target: z.string().min(3).max(200),         // 'usb' oder 'tcp:192.168.x.x:9100' etc.
  printer_model: z.string().min(3).max(50).optional(),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!checkRateLimit(`print-agent-pair:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Zu viele Pairing-Versuche.' }, { status: 429 })
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültiger Pairing-Request' }, { status: 400 })
  }

  const result = await completePairing({
    pairingCode: parsed.data.code,
    printerTarget: parsed.data.printer_target,
    printerModel: parsed.data.printer_model,
  })

  if ('error' in result) {
    return NextResponse.json(
      { error: 'Pairing-Code ungültig oder abgelaufen' },
      { status: 401 },
    )
  }

  return NextResponse.json({
    api_token: result.apiToken,
    bridge_id: result.bridge.id,
    terminal_id: result.bridge.terminal_id,
    company_id: result.bridge.company_id,
  })
}
