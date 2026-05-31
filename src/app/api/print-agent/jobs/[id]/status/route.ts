/**
 * POST /api/print-agent/jobs/[id]/status
 *
 * Bridge meldet das Druckergebnis. pickup_token muss matchen, sonst wird das
 * Update verworfen (verhindert dass eine zweite Bridge fremde Jobs commiten kann).
 * Bei status='failed' optional eine error_message.
 *
 * Bei 'paper_out' updaten wir die Bridge-Status, nicht den Job (Job bleibt pending
 * und wird vom nächsten Poll erneut versucht — Brother hat einen internen Retry-Mechanismus).
 *
 * Header: Authorization: Bearer <api_token>
 * Body:   { pickup_token, status: 'printed' | 'failed' | 'paper_out', error_message? }
 * Rück:   204 No Content | 401 | 403 | 400
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  authenticateBridge,
  extractBearerToken,
  reportJobStatus,
  updateBridgeStatus,
} from '@/lib/print-jobs'

const bodySchema = z.object({
  pickup_token: z.string().uuid(),
  status: z.enum(['printed', 'failed', 'paper_out']),
  error_message: z.string().max(500).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: jobId } = await params

  const token = extractBearerToken(req.headers.get('authorization'))
  const bridge = await authenticateBridge(token)
  if (!bridge) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültiger Status-Report' }, { status: 400 })
  }

  // 'paper_out' = Drucker meldet leere Rolle. Job bleibt zum Retry,
  // aber Bridge-Status wird aktualisiert → Admin-UI zeigt Warnung.
  if (parsed.data.status === 'paper_out') {
    await updateBridgeStatus({
      bridgeId: bridge.id,
      status: 'paper_out',
      lastError: parsed.data.error_message ?? 'Rolle leer oder Cover offen',
    })
    return new NextResponse(null, { status: 204 })
  }

  const ok = await reportJobStatus({
    jobId,
    pickupToken: parsed.data.pickup_token,
    status: parsed.data.status,
    errorMessage: parsed.data.error_message,
  })
  if (!ok) {
    return NextResponse.json({ error: 'Job not found or token mismatch' }, { status: 403 })
  }

  // Bridge ist offensichtlich gesund → Status auf 'online' (falls vorher paper_out/error)
  if (parsed.data.status === 'printed' && bridge.status !== 'online') {
    void updateBridgeStatus({ bridgeId: bridge.id, status: 'online', lastError: null })
  }

  return new NextResponse(null, { status: 204 })
}
