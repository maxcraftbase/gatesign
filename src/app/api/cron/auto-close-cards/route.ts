/**
 * POST /api/cron/auto-close-cards
 *
 * Schließt vergessene Besucher-Karten automatisch: alle offenen Check-ins mit
 * Tagesnummer, deren card_date VOR dem heutigen Tag (Europe/Berlin) liegt.
 * Damit sammeln sich keine ewig-offenen Karten an und Tagesnummern können sich
 * über Tage hinweg nicht kollidieren (stützt den terminal-scoped Checkout).
 *
 * Schedule (Upstash QStash): täglich ~00:05 Berliner Zeit.
 * Auth: Header `x-cron-secret` == CRON_SECRET (Pattern wie daily-digest/agents).
 *
 * Rück: 200 { closed, cutoff_date } | 401 | 500
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseUrl, sbServiceHeaders } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // „Heute" in Berliner Zeit als YYYY-MM-DD. en-CA liefert ISO-Format.
    const berlinToday = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' })

    // Nur Karten von VOR heute schließen — wer heute eingecheckt hat, bleibt offen.
    // Filter sind fest verdrahtet (nie unbounded), checkout_method markiert die Quelle.
    const res = await fetch(
      `${supabaseUrl}/rest/v1/check_ins` +
        `?checked_out_at=is.null` +
        `&card_number=not.is.null` +
        `&card_date=lt.${berlinToday}` +
        `&select=id`,
      {
        method: 'PATCH',
        headers: {
          ...sbServiceHeaders(),
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          checked_out_at: new Date().toISOString(),
          checkout_method: 'auto_close',
        }),
      },
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('[auto-close-cards] Supabase-Fehler:', err)
      return NextResponse.json({ error: 'Auto-Close fehlgeschlagen' }, { status: 500 })
    }

    const closed: { id: string }[] = await res.json()
    return NextResponse.json({ closed: closed.length, cutoff_date: berlinToday })
  } catch (err) {
    console.error('[auto-close-cards] error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
