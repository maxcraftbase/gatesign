/**
 * POST /api/cron/reaper-print-jobs
 *
 * Räumt hängende Druckjobs ab: Jobs, die als `sent` markiert (also von einer Bridge
 * abgeholt) wurden, aber seit >2 Minuten keinen Abschluss-Status gemeldet haben.
 * Typische Ursache: Bridge ist nach dem Pickup abgestürzt / Netz weg. Solche Jobs
 * werden auf `failed` gesetzt, damit das Admin-UI sie nicht ewig als „in Arbeit"
 * zeigt und der Job nicht doppelt gedruckt wird (der pickup_token bleibt verbraucht).
 *
 * Schedule (Upstash QStash): alle ~2 Minuten.
 * Auth: Header `x-cron-secret` == CRON_SECRET (Pattern wie auto-close-cards).
 *
 * Rück: 200 { reaped, cutoff } | 401 | 500
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseUrl, sbServiceHeaders } from '@/lib/supabase-server'

/** Ein Job gilt als hängend, wenn er länger als das hier offen `sent` ist. */
const STUCK_AFTER_MS = 2 * 60 * 1000

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date().toISOString()
    const cutoff = new Date(Date.now() - STUCK_AFTER_MS).toISOString()

    // Timestamps MÜSSEN url-encoded werden, sonst interpretiert PostgREST das `+`
    // der Zeitzone als Leerzeichen (siehe Memory feedback_url_encode_timestamps).
    const res = await fetch(
      `${supabaseUrl}/rest/v1/print_jobs` +
        `?status=eq.sent` +
        `&picked_up_at=lt.${encodeURIComponent(cutoff)}` +
        `&select=id`,
      {
        method: 'PATCH',
        headers: {
          ...sbServiceHeaders(),
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          status: 'failed',
          error_message: 'reaper_timeout',
          completed_at: now,
        }),
      },
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('[reaper-print-jobs] Supabase-Fehler:', err)
      return NextResponse.json({ error: 'Reaper fehlgeschlagen' }, { status: 500 })
    }

    const reaped: { id: string }[] = await res.json()
    return NextResponse.json({ reaped: reaped.length, cutoff })
  } catch (err) {
    console.error('[reaper-print-jobs] error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
