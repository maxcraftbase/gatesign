/**
 * POST /api/print-agent/heartbeat
 *
 * Bridge meldet ihren aktuellen Zustand — typisch direkt nach dem Start, beim
 * Beenden, oder bei Status-Wechseln (z.B. wenn der Drucker plötzlich auf USB
 * antwortet). last_seen wird automatisch aktualisiert.
 *
 * Auch ohne Body nutzbar: GET /api/print-agent/jobs aktualisiert last_seen
 * implizit. Heartbeat ist explizit für Status-Wechsel + nice-to-have-Pings.
 *
 * Header: Authorization: Bearer <api_token>
 * Body:   { status: 'online' | 'offline' | 'paper_out' | 'error', error?: string }  (optional)
 * Rück:   204 No Content | 401
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateBridge, extractBearerToken, updateBridgeStatus } from '@/lib/print-jobs'

const bodySchema = z.object({
  status: z.enum(['online', 'offline', 'paper_out', 'error']).optional(),
  error: z.string().max(500).nullable().optional(),
}).optional()

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'))
  const bridge = await authenticateBridge(token)
  if (!bridge) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)

  // Body ist optional — leerer Heartbeat ist gültig (nur last_seen-Update,
  // das hat authenticateBridge schon erledigt).
  if (parsed.success && parsed.data?.status) {
    await updateBridgeStatus({
      bridgeId: bridge.id,
      status: parsed.data.status,
      lastError: parsed.data.error ?? null,
    })
  }

  return new NextResponse(null, { status: 204 })
}
