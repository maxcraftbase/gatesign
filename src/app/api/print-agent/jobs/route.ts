/**
 * GET /api/print-agent/jobs
 *
 * Bridge-Polling-Endpoint. Authentifiziert via Bearer-Token, gibt nächsten pending
 * Job zurück (atomar markiert als 'sent' mit Idempotency-Token). Wenn kein Job
 * da ist: 204 No Content (Short-Polling-Pattern, Bridge wartet 3s und ruft wieder).
 *
 * Header:  Authorization: Bearer <api_token>
 * Rück:    200 + { id, png_base64, pickup_token, check_in_id }
 *          204 (kein Job)
 *          401 (ungültiger Token)
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateBridge, extractBearerToken, pickUpNextJob, updateBridgeStatus } from '@/lib/print-jobs'

export async function GET(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'))
  const bridge = await authenticateBridge(token)
  if (!bridge) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Polling-Heartbeat: Bridge ist offensichtlich online wenn sie pollt
  if (bridge.status !== 'online' && bridge.status !== 'paper_out') {
    void updateBridgeStatus({ bridgeId: bridge.id, status: 'online', lastError: null })
  }

  const job = await pickUpNextJob(bridge.id)
  if (!job) {
    return new NextResponse(null, { status: 204 })
  }

  return NextResponse.json({
    id: job.id,
    check_in_id: job.check_in_id,
    png_base64: job.png_base64,
    pickup_token: job.pickup_token,
  })
}
