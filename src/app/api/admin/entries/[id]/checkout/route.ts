import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { supabaseUrl, anonKey } from '@/lib/supabase-server'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const res = await fetch(
      `${supabaseUrl}/rest/v1/check_ins?id=eq.${id}&company_id=eq.${ctx.company.id}`,
      {
        method: 'PATCH',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${ctx.accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ departed_at: new Date().toISOString() }),
      }
    )

    if (!res.ok) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[checkout] error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
