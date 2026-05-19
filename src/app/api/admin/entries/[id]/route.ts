import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { logAction } from '@/lib/audit'
import { supabaseUrl, serviceKey } from '@/lib/supabase-server'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    // Verify entry belongs to this company before deleting
    const checkRes = await fetch(
      `${supabaseUrl}/rest/v1/check_ins?id=eq.${id}&company_id=eq.${ctx.company.id}&select=id,driver_name`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
    )
    const checkData = await checkRes.json()
    if (!Array.isArray(checkData) || checkData.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const entry = checkData[0] as { id: string; driver_name: string }

    const delRes = await fetch(`${supabaseUrl}/rest/v1/check_ins?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: 'return=minimal',
      },
    })

    if (!delRes.ok) return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 })

    await logAction(ctx, 'entry_deleted', { entry_id: id, driver_name: entry.driver_name })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[entry delete] error:', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
