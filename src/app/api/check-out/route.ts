/**
 * POST /api/check-out
 *
 * Self-Service-Checkout am Terminal: Besucher tippt seine Tagesnummer ein,
 * Backend findet den offenen Check-in und setzt checked_out_at.
 *
 * Lookup-Strategie: OHNE Datums-Filter, weil ein Besucher der um 23:55 angemeldet
 * wurde und um 00:30 abmeldet eine "gestrige" card_number haben würde. Wir nehmen
 * den jüngsten offenen Check-in mit dieser Nummer in dieser Company. Bei zwei
 * gleichzeitig offenen Check-ins mit derselben Nummer (sollte nicht passieren,
 * weil card_number Tagesnummer-eindeutig ist) gewinnt der jüngste.
 *
 * Body: { slug, card_number }
 * Rück: 200 { success, visitor_name } | 404 not_found | 429 rate-limited
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCompanyBySlug, getTerminalBySlug } from '@/lib/company'
import { checkRateLimit } from '@/lib/rate-limit'
import { supabaseUrl, sbServiceHeaders } from '@/lib/supabase-server'

const checkOutSchema = z.object({
  slug: z.string().min(1).max(100),
  terminal_slug: z.string().min(1).max(100).nullish(),
  card_number: z.number().int().positive().max(99_999),
})

interface OpenCheckIn {
  id: string
  driver_name: string
  company_name: string
  card_number: number
  card_date: string | null
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    if (!checkRateLimit(`check-out:${ip}`, 20, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warten.' }, { status: 429 })
    }

    const parsed = checkOutSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })
    }

    const company = await getCompanyBySlug(parsed.data.slug)
    if (!company) {
      return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 })
    }

    // Tagesnummern sind PRO TERMINAL eindeutig (daily_card_sequences zählt pro
    // company+terminal+date). Bei mehreren Terminals haben also zwei Besucher an
    // verschiedenen Terminals u.U. dieselbe Nummer. Deshalb MUSS der Checkout auf
    // das Terminal scopen, an dem die Nummer eingegeben wurde — sonst checkt „42"
    // den falschen Besucher aus.
    const terminal = parsed.data.terminal_slug
      ? await getTerminalBySlug(company.id, parsed.data.terminal_slug)
      : null

    // Offenen Check-in für diese card_number suchen — kein Datums-Filter,
    // damit Cross-Day-Cases (vor Mitternacht angemeldet, danach abgemeldet) funktionieren.
    const queryUrl =
      `${supabaseUrl}/rest/v1/check_ins` +
      `?company_id=eq.${encodeURIComponent(company.id)}` +
      (terminal ? `&terminal_id=eq.${encodeURIComponent(terminal.id)}` : '') +
      `&card_number=eq.${parsed.data.card_number}` +
      `&checked_out_at=is.null` +
      `&order=created_at.desc` +
      `&limit=1` +
      `&select=id,driver_name,company_name,card_number,card_date`

    const findRes = await fetch(queryUrl, { headers: sbServiceHeaders(), cache: 'no-store' })
    if (!findRes.ok) {
      return NextResponse.json({ error: 'Fehler bei der Suche' }, { status: 500 })
    }
    const rows: OpenCheckIn[] = await findRes.json()
    if (rows.length === 0) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    const openCheckIn = rows[0]

    // Conditional UPDATE: nur wenn noch nicht ausgecheckt (vermeidet Race)
    const patchRes = await fetch(
      `${supabaseUrl}/rest/v1/check_ins?id=eq.${openCheckIn.id}&checked_out_at=is.null`,
      {
        method: 'PATCH',
        headers: {
          ...sbServiceHeaders(),
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          checked_out_at: new Date().toISOString(),
          checkout_method: 'card_number',
          // departed_at mitschreiben: kanonisches „Gelände verlassen"-Feld, hält die
          // Admin-KPI „Auf Gelände" konsistent mit dem Self-Service-Checkout.
          departed_at: new Date().toISOString(),
        }),
      },
    )
    if (!patchRes.ok) {
      return NextResponse.json({ error: 'Checkout fehlgeschlagen' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      visitor_name: openCheckIn.driver_name,
      visitor_company: openCheckIn.company_name,
      card_number: openCheckIn.card_number,
    })
  } catch (err) {
    console.error('Check-out route error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
