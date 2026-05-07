import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCompanyBySlug } from '@/lib/company'
import { checkRateLimit } from '@/lib/rate-limit'
import { supabaseUrl, anonKey } from '@/lib/supabase-server'

const checkInSchema = z.object({
  slug: z.string().optional(),
  visitor_type: z.enum(['truck', 'visitor', 'service']).optional(),
  driver_name: z.string().min(1).max(100),
  company_name: z.string().min(1).max(150),
  license_plate: z.string().min(1).max(20),
  trailer_plate: z.string().max(20).optional(),
  phone: z.string().max(30).optional(),
  contact_person: z.string().max(100).optional(),
  language: z.enum(['de', 'en', 'pl', 'ro', 'cs', 'hu', 'bg', 'uk', 'ru', 'tr']),
  briefing_accepted: z.boolean().optional(),
  briefing_version: z.string().optional(),
  has_signature: z.boolean().optional(),
  signature_data: z.string().max(100_000).optional(),
  reference_number: z.string().max(50).optional(),
})

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

    const payload: Record<string, unknown> = {
      visitor_type: visitor_type ?? 'truck',
      driver_name,
      company_name,
      license_plate,
      language,
      briefing_accepted: briefing_accepted ?? false,
      briefing_version: briefing_version ?? '1.0',
      has_signature: has_signature ?? false,
    }

    if (company) payload.company_id = company.id
    if (briefing_accepted) payload.briefing_accepted_at = new Date().toISOString()
    if (phone) payload.phone = phone
    if (trailer_plate) payload.trailer_plate = trailer_plate
    if (contact_person) payload.contact_person = contact_person
    if (signature_data) payload.signature_data = signature_data
    if (reference_number) payload.reference_number = reference_number

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
    return NextResponse.json({ success: true, id: data[0]?.id })
  } catch (err) {
    console.error('Check-in route error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
