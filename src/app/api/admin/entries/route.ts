import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = 50
    const offset = (page - 1) * limit

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const params = new URLSearchParams({
      company_id: `eq.${ctx.company.id}`,
      select: 'id,created_at,driver_name,company_name,license_plate,trailer_plate,phone,language,visitor_type,briefing_accepted,briefing_accepted_at,has_signature,reference_number,contact_person,staff_note,staff_note_translated',
      order: 'created_at.desc',
      limit: String(limit),
      offset: String(offset),
    })

    const res = await fetch(`${supabaseUrl}/rest/v1/check_ins?${params}`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${ctx.accessToken}`, Prefer: 'count=exact' },
      cache: 'no-store',
    })

    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })

    const data = await res.json()
    const total = parseInt(res.headers.get('content-range')?.split('/')[1] ?? '0')

    // Fetch logo URL from settings
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    let logoUrl = ''
    try {
      const logoRes = await fetch(
        `${supabaseUrl}/rest/v1/app_settings?company_id=eq.${ctx.company.id}&key=eq.logo_url&select=value`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
      )
      const logoData = await logoRes.json()
      logoUrl = logoData?.[0]?.value ?? ''
    } catch { /* ignore */ }

    return NextResponse.json({ entries: data, total, page, limit, companyName: ctx.company.name, logoUrl })
  } catch (err) {
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
