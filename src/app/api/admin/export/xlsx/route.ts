import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { supabaseUrl, anonKey } from '@/lib/supabase-server'
import { buildCheckInsXlsx, type CheckInExportRow } from '@/lib/excel-export'

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

    const data: CheckInExportRow[] = await res.json()
    const buffer = await buildCheckInsXlsx(data)
    const filename = `gatesign-${ctx.company.slug}-${new Date().toISOString().slice(0, 10)}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[export/xlsx] error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
