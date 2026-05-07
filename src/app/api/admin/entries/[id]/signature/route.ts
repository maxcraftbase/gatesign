import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { supabaseUrl, serviceKey } from '@/lib/supabase-server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const res = await fetch(
      `${supabaseUrl}/rest/v1/check_ins?id=eq.${id}&company_id=eq.${ctx.company.id}&select=signature_data&limit=1`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
    )
    if (!res.ok) return NextResponse.json({ error: 'DB error' }, { status: 500 })

    const rows = await res.json()
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ signature_data: rows[0].signature_data ?? null })
  } catch {
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
