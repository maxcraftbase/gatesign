import { NextRequest, NextResponse } from 'next/server'
import { getCompanyBySlug } from '@/lib/company'
import { supabaseUrl, anonKey } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')
    if (!slug) return NextResponse.json({}, { status: 400 })

    const company = await getCompanyBySlug(slug)
    if (!company) return NextResponse.json({}, { status: 404 })
    const res = await fetch(
      `${supabaseUrl}/rest/v1/app_settings?company_id=eq.${company.id}&select=key,value`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }, cache: 'no-store' }
    )
    const rows: { key: string; value: string }[] = await res.json()
    const settings: Record<string, string> = { company_name: company.name }
    for (const row of rows) settings[row.key] = row.value
    return NextResponse.json(settings)
  } catch (err) {
    console.error('[settings] error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
