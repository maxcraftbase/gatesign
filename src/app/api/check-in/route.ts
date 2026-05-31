import { NextRequest, NextResponse, after } from 'next/server'
import { z } from 'zod'
import { getCompanyBySlug, getTerminalBySlug } from '@/lib/company'
import { checkRateLimit } from '@/lib/rate-limit'
import { supabaseUrl, anonKey } from '@/lib/supabase-server'
import { hasAddon } from '@/lib/addons'
import {
  allocateCardNumber,
  getBridgeByTerminalId,
  createPrintJob,
} from '@/lib/print-jobs'
import { renderVisitorCard } from '@/lib/card-renderer'

const checkInSchema = z.object({
  slug: z.string().nullish(),
  terminal_slug: z.string().nullish(),
  visitor_type: z.enum(['truck', 'visitor', 'service']).nullish(),
  driver_name: z.string().min(1).max(100),
  company_name: z.string().min(1).max(150),
  license_plate: z.string().min(1).max(20),
  trailer_plate: z.string().max(20).nullish(),
  phone: z.string().max(30).nullish(),
  contact_person: z.string().max(100).nullish(),
  language: z.enum(['de', 'en', 'pl', 'ro', 'cs', 'hu', 'bg', 'uk', 'ru', 'tr']),
  briefing_accepted: z.boolean().nullish(),
  briefing_version: z.string().nullish(),
  has_signature: z.boolean().nullish(),
  signature_data: z.string().max(100_000).nullish(),
  reference_number: z.string().max(50).nullish(),
})

// Besuchertypen, die eine gedruckte Tagesnummern-Karte bekommen.
// Bewusst nur Besucher + Service-Mitarbeiter — analog zur „Im Gebäude"-Logik
// (Anwesenheits-Zählung + Self-Service-Checkout), die LKW-Fahrer ebenfalls
// ausklammert. LKW laufen über den Logistik-Flow ohne Kartendruck.
const CARD_VISITOR_TYPES = new Set(['visitor', 'service'])

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    if (!checkRateLimit(`check-in:${ip}`, 20, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warten.' }, { status: 429 })
    }

    const parsed = checkInSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe' }, { status: 400 })
    }

    const {
      slug,
      terminal_slug,
      visitor_type,
      driver_name,
      company_name,
      license_plate,
      trailer_plate,
      phone,
      contact_person,
      language,
      briefing_accepted,
      briefing_version,
      has_signature,
      signature_data,
      reference_number,
    } = parsed.data

    const company = slug ? await getCompanyBySlug(slug) : null
    const terminal = (company && terminal_slug) ? await getTerminalBySlug(company.id, terminal_slug) : null

    interface CheckInPayload {
      visitor_type: string
      driver_name: string
      company_name: string
      license_plate: string
      language: string
      briefing_accepted: boolean
      briefing_version: string
      has_signature: boolean
      company_id?: string
      terminal_id?: string
      briefing_accepted_at?: string
      phone?: string
      trailer_plate?: string
      contact_person?: string
      signature_data?: string
      reference_number?: string
      card_number?: number
      card_date?: string
    }

    const payload: CheckInPayload = {
      visitor_type: visitor_type ?? 'truck',
      driver_name,
      company_name,
      license_plate,
      language,
      briefing_accepted: briefing_accepted ?? false,
      briefing_version: briefing_version ?? '1.0',
      has_signature: has_signature ?? false,
    }

    if (company)   payload.company_id = company.id
    if (terminal)  payload.terminal_id = terminal.id
    if (briefing_accepted) payload.briefing_accepted_at = new Date().toISOString()
    if (phone)          payload.phone = phone
    if (trailer_plate)  payload.trailer_plate = trailer_plate
    if (contact_person) payload.contact_person = contact_person
    if (signature_data) payload.signature_data = signature_data
    if (reference_number) payload.reference_number = reference_number

    // ── Drucker-Add-on: Tagesnummer vor dem Insert atomar ziehen ──
    // Nur wenn company+terminal vorhanden UND Add-on aktiv.
    // Datum wird hier fixiert und identisch im check_ins-Row gesetzt,
    // damit Tagesübergänge zwischen Allokation und Insert konsistent bleiben.
    let cardNumber: number | null = null
    if (
      company &&
      terminal &&
      CARD_VISITOR_TYPES.has(payload.visitor_type) &&
      await hasAddon(company.id, 'printer')
    ) {
      const today = new Date().toISOString().split('T')[0]  // YYYY-MM-DD
      cardNumber = await allocateCardNumber({
        companyId: company.id,
        terminalId: terminal.id,
        cardDate: today,
      })
      if (cardNumber !== null) {
        payload.card_number = cardNumber
        payload.card_date = today
      }
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/check_ins`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Supabase insert error:', err)
      return NextResponse.json({ error: 'Failed to save check-in' }, { status: 500 })
    }

    const data = await res.json()
    const checkInId: string | undefined = data[0]?.id

    // ── Drucker-Add-on: Karten-PNG generieren + Print-Job in Queue ──
    // Best-effort: wenn die Bridge offline ist oder das Rendering kracht,
    // wollen wir den Check-in NICHT scheitern lassen — die card_number ist
    // bereits vergeben, der Besucher kann seinen Beleg sehen.
    //
    // after() statt losem `void promise`: die Arbeit läuft nach dem Senden der
    // Response, wird aber von Next.js bis zum Abschluss am Leben gehalten (auch
    // auf Serverless, wo ein dangling promise sonst abgeschnitten würde).
    if (checkInId && cardNumber !== null && company && terminal) {
      const job = {
        checkInId,
        cardNumber,
        terminalId: terminal.id,
        visitorName: driver_name,
        visitorCompany: company_name,
        hostCompanyName: company.name,
        language,
      }
      after(async () => {
        try {
          await enqueuePrintJob(job)
        } catch (err) {
          console.error('[check-in] Print-Job enqueue fehlgeschlagen:', err)
        }
      })
    }

    return NextResponse.json({
      success: true,
      id: checkInId,
      ...(cardNumber !== null ? { card_number: cardNumber } : {}),
    })
  } catch (err) {
    console.error('Check-in route error:', err instanceof Error ? err.message : String(err), err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Print-Job-Helper (asynchron nach Check-in)
// ─────────────────────────────────────────────────────────────────────────────

async function enqueuePrintJob(opts: {
  checkInId: string
  cardNumber: number
  terminalId: string
  visitorName: string
  visitorCompany: string
  hostCompanyName: string
  language: 'de' | 'en' | 'pl' | 'ro' | 'cs' | 'hu' | 'bg' | 'uk' | 'ru' | 'tr'
}): Promise<void> {
  const bridge = await getBridgeByTerminalId(opts.terminalId)
  if (!bridge) {
    console.warn(`[check-in] Keine Print-Bridge für Terminal ${opts.terminalId} — Job verworfen.`)
    return
  }

  const pngBuffer = await renderVisitorCard({
    cardNumber: opts.cardNumber,
    visitorName: opts.visitorName,
    visitorCompany: opts.visitorCompany,
    hostCompanyName: opts.hostCompanyName,
    date: new Date(),
    language: opts.language,
  })

  const pngBase64 = pngBuffer.toString('base64')
  await createPrintJob({
    bridgeId: bridge.id,
    checkInId: opts.checkInId,
    pngBase64,
  })
}
