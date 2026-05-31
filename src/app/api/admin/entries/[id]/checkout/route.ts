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

    // departed_at ist das kanonische „hat das Gelände verlassen"-Feld (KPI „Auf Gelände").
    // Für Karten-Besucher (Drucker-Add-on) schreiben wir zusätzlich checked_out_at +
    // checkout_method='admin', damit Karten-Status und Self-Service-Checkout konsistent
    // bleiben. Beides in einem PATCH zu setzen ist unschädlich, auch wenn keine Karte existiert.
    const now = new Date().toISOString()
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
        body: JSON.stringify({ departed_at: now, checked_out_at: now, checkout_method: 'admin' }),
      }
    )

    if (!res.ok) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[checkout] error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
