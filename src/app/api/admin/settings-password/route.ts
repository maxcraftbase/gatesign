import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { password } = await req.json() as { password: string }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const res = await fetch(
      `${supabaseUrl}/rest/v1/app_settings?company_id=eq.${ctx.company.id}&key=eq.settings_password&select=value`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${ctx.accessToken}` }, cache: 'no-store' }
    )
    const rows: { value: string }[] = await res.json()
    const stored = rows[0]?.value ?? ''

    if (!stored) {
      // No password set yet — allow access (first time setup)
      return NextResponse.json({ ok: true, firstTime: true })
    }

    if (password !== stored) {
      return NextResponse.json({ error: 'Falsches Passwort' }, { status: 401 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
