import { NextRequest, NextResponse } from 'next/server'
import { getCompanyBySlug } from '@/lib/company'
import { checkRateLimit } from '@/lib/rate-limit'
import { supabaseUrl, anonKey } from '@/lib/supabase-server'

const VALID_VISITOR_TYPES = ['truck', 'visitor', 'service'] as const
const VALID_LANGUAGES = ['de', 'en', 'pl', 'ro', 'cs', 'hu', 'bg', 'uk', 'ru', 'tr'] as const

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    if (!checkRateLimit(`check-in:${ip}`, 20, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warten.' }, { status: 429 })
    }

    const body = await req.json()
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
    } = body

    // Required fields
    if (!driver_name || !company_name || !license_plate || !language) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Whitelist checks
    if (visitor_type && !VALID_VISITOR_TYPES.includes(visitor_type)) {
      return NextResponse.json({ error: 'Ungültiger Besuchertyp' }, { status: 400 })
    }
    if (!VALID_LANGUAGES.includes(language)) {
      return NextResponse.json({ error: 'Ungültige Sprache' }, { status: 400 })
    }

    // Length limits
    if (String(driver_name).length > 100) return NextResponse.json({ error: 'driver_name zu lang' }, { status: 400 })
    if (String(company_name).length > 150) return NextResponse.json({ error: 'company_name zu lang' }, { status: 400 })
    if (String(license_plate).length > 20) return NextResponse.json({ error: 'license_plate zu lang' }, { status: 400 })
    if (trailer_plate && String(trailer_plate).length > 20) return NextResponse.json({ error: 'trailer_plate zu lang' }, { status: 400 })
    if (phone && String(phone).length > 30) return NextResponse.json({ error: 'phone zu lang' }, { status: 400 })
    if (contact_person && String(contact_person).length > 100) return NextResponse.json({ error: 'contact_person zu lang' }, { status: 400 })
    if (reference_number && String(reference_number).length > 50) return NextResponse.json({ error: 'reference_number zu lang' }, { status: 400 })
    if (signature_data && String(signature_data).length > 100_000) return NextResponse.json({ error: 'signature_data zu groß' }, { status: 400 })

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
