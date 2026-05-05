import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'

export async function GET() {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const [settingsRes, briefingsRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/app_settings?company_id=eq.${ctx.company.id}&select=key,value`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${ctx.accessToken}` },
        cache: 'no-store',
      }),
      fetch(`${supabaseUrl}/rest/v1/safety_briefings?company_id=eq.${ctx.company.id}&select=language,visitor_type,content,version&order=language.asc`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${ctx.accessToken}` },
        cache: 'no-store',
      }),
    ])

    const settingsRows: { key: string; value: string }[] = await settingsRes.json()
    const settings: Record<string, string> = { company_name: ctx.company.name }
    for (const row of settingsRows) settings[row.key] = row.value

    const briefings = await briefingsRes.json()
    return NextResponse.json({ settings, briefings })
  } catch (err) {
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { settings, briefings } = body

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    if (settings && typeof settings === 'object') {
      const allSettings = settings as Record<string, string>

      if (allSettings.company_name) {
        await fetch(`${supabaseUrl}/rest/v1/companies?id=eq.${ctx.company.id}`, {
          method: 'PATCH',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${ctx.accessToken}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ name: allSettings.company_name }),
        })
      }

      const { company_name: _cn, ...settingsWithoutName } = allSettings
      const rows = Object.entries(settingsWithoutName).map(([key, value]) => ({
        company_id: ctx.company.id,
        key,
        value: String(value),
        updated_at: new Date().toISOString(),
      }))
      const settingsWriteRes = await fetch(`${supabaseUrl}/rest/v1/app_settings`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${ctx.accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(rows),
      })

      if (!settingsWriteRes.ok) {
        console.error('Settings save error:', await settingsWriteRes.text())
        return NextResponse.json({ error: 'Einstellungen konnten nicht gespeichert werden.' }, { status: 500 })
      }
    }

    if (briefings && Array.isArray(briefings)) {
      for (const b of briefings) {
        await fetch(`${supabaseUrl}/rest/v1/safety_briefings`, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${ctx.accessToken}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=minimal',
          },
          body: JSON.stringify({
            company_id: ctx.company.id,
            language: b.language,
            visitor_type: b.visitor_type ?? 'truck',
            content: b.content,
            version: b.version ?? '1.0',
            updated_at: new Date().toISOString(),
          }),
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
