import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { logAction } from '@/lib/audit'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { staff_note, staff_note_translated, assigned_contact } = body

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Verify this entry belongs to the company
    const checkRes = await fetch(
      `${supabaseUrl}/rest/v1/check_ins?id=eq.${id}&company_id=eq.${ctx.company.id}&select=id`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
    )
    const checkData = await checkRes.json()
    if (!Array.isArray(checkData) || checkData.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const patchRes = await fetch(`${supabaseUrl}/rest/v1/check_ins?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ staff_note: staff_note ?? null, staff_note_translated: staff_note_translated ?? null, assigned_contact: assigned_contact ?? null }),
    })

    if (!patchRes.ok) return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
    await logAction(ctx, 'note_saved', { entry_id: id })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
