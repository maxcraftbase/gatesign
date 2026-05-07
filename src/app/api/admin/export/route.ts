import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { supabaseUrl, anonKey } from '@/lib/supabase-server'

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) return '"' + str.replace(/"/g, '""') + '"'
  return str
}

export async function GET() {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const params = new URLSearchParams({
      company_id: `eq.${ctx.company.id}`,
      select: 'id,created_at,visitor_type,driver_name,company_name,license_plate,trailer_plate,phone,language,briefing_accepted,briefing_accepted_at,has_signature,reference_number,contact_person',
      order: 'created_at.desc',
      limit: '10000',
    })

    const res = await fetch(`${supabaseUrl}/rest/v1/check_ins?${params}`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${ctx.accessToken}` },
      cache: 'no-store',
    })

    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })

    const data: Record<string, unknown>[] = await res.json()
    const headers = ['ID', 'Datum/Zeit', 'Typ', 'Fahrer', 'Firma', 'Kennzeichen', 'Auflieger', 'Telefon', 'Ansprechpartner', 'Sprache', 'Belehrung', 'Belehrung-Zeit', 'Unterschrift', 'Referenz']
    const rows = data.map(row => [
      escapeCSV(row.id), escapeCSV(row.created_at), escapeCSV(row.visitor_type),
      escapeCSV(row.driver_name), escapeCSV(row.company_name), escapeCSV(row.license_plate),
      escapeCSV(row.trailer_plate), escapeCSV(row.phone), escapeCSV(row.contact_person),
      escapeCSV(row.language), escapeCSV(row.briefing_accepted ? 'Ja' : 'Nein'),
      escapeCSV(row.briefing_accepted_at), escapeCSV(row.has_signature ? 'Ja' : 'Nein'),
      escapeCSV(row.reference_number),
    ].join(','))

    const csv = [headers.join(','), ...rows].join('\n')
    return new NextResponse('\uFEFF' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="gatesign-${ctx.company.slug}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (err) {
    console.error('[export] error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
