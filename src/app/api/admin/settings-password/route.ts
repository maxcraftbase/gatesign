import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { supabaseUrl, anonKey } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { password } = await req.json() as { password: string }

    const res = await fetch(
      `${supabaseUrl}/rest/v1/app_settings?company_id=eq.${ctx.company.id}&key=eq.settings_password&select=value`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${ctx.accessToken}` }, cache: 'no-store' }
    )
    const rows: { value: string }[] = await res.json()
    const stored = rows[0]?.value ?? ''

    if (!stored) {
      return NextResponse.json({ ok: true, firstTime: true })
    }

    let match = false
    try {
      const a = Buffer.from(String(password))
      const b = Buffer.from(stored)
      match = a.length === b.length && timingSafeEqual(a, b)
    } catch {
      match = false
    }

    if (!match) {
      return NextResponse.json({ error: 'Falsches Passwort' }, { status: 401 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[settings-password] error:', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
