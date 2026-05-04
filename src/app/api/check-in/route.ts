import { NextRequest, NextResponse } from 'next/server'
import { getCompanyBySlug } from '@/lib/company'

export async function POST(req: NextRequest) {
  try {
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

    if (!driver_name || !company_name || !license_plate || !language) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const company = slug ? await getCompanyBySlug(slug) : null

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
