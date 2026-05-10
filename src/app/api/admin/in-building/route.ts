import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { supabaseUrl, anonKey } from '@/lib/supabase-server'

export async function GET() {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Entries checked in today and not yet departed
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const params = new URLSearchParams({
      company_id: `eq.${ctx.company.id}`,
      departed_at: 'is.null',
      created_at: `gte.${todayStart.toISOString()}`,
      select: 'id,created_at,driver_name,company_name,license_plate,language,visitor_type,reference_number,contact_person',
      order: 'created_at.desc',
    })

    // Append in-filter manually — URLSearchParams would encode parentheses/commas
    // which PostgREST cannot parse
    const res = await fetch(`${supabaseUrl}/rest/v1/check_ins?${params}&visitor_type=in.(visitor,service)`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${ctx.accessToken}` },
      cache: 'no-store',
    })

    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })

    const entries = await res.json()
    return NextResponse.json({ entries, companyName: ctx.company.name })
  } catch (err) {
    console.error('[in-building] error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
