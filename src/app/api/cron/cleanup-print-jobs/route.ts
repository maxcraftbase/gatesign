/**
 * POST /api/cron/cleanup-print-jobs
 *
 * Hält die print_jobs-Queue klein: löscht alle Jobs, die älter als 24 h sind —
 * unabhängig vom Status. Die Jobs sind kurzlebige Druckaufträge (inkl. PNG als
 * base64), ihr Verlauf hat keinen fachlichen Wert; die Karten-Historie lebt in
 * check_ins. Damit wächst die Tabelle nicht unbegrenzt.
 *
 * Schedule (Upstash QStash): täglich ~04:00 Berliner Zeit.
 * Auth: Header `x-cron-secret` == CRON_SECRET (Pattern wie auto-close-cards).
 *
 * Rück: 200 { deleted, cutoff } | 401 | 500
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseUrl, sbServiceHeaders } from '@/lib/supabase-server'

/** Jobs älter als das hier werden gelöscht. */
const RETENTION_MS = 24 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cutoff = new Date(Date.now() - RETENTION_MS).toISOString()

    // Timestamp url-encoden (PostgREST `+`-Bug, siehe feedback_url_encode_timestamps).
    // created_at=lt.<cutoff> ist hart gesetzt → niemals ein unbounded DELETE.
    const res = await fetch(
      `${supabaseUrl}/rest/v1/print_jobs` +
        `?created_at=lt.${encodeURIComponent(cutoff)}` +
        `&select=id`,
      {
        method: 'DELETE',
        headers: {
          ...sbServiceHeaders(),
          Prefer: 'return=representation',
        },
      },
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('[cleanup-print-jobs] Supabase-Fehler:', err)
      return NextResponse.json({ error: 'Cleanup fehlgeschlagen' }, { status: 500 })
    }

    const deleted: { id: string }[] = await res.json()
    return NextResponse.json({ deleted: deleted.length, cutoff })
  } catch (err) {
    console.error('[cleanup-print-jobs] error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
