import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getAuthToken(): Promise<{ user: unknown; accessToken: string } | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null

  const allCookies = cookieStore.getAll()
  const authCookieName = allCookies.find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))?.name
  let accessToken = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (authCookieName) {
    const cookieVal = cookieStore.get(authCookieName)?.value ?? ''
    try {
      let decoded = cookieVal
      if (decoded.startsWith('base64-')) {
        decoded = Buffer.from(decoded.slice(7), 'base64url').toString('utf-8')
      }
      const session = JSON.parse(decoded)
      if (session.access_token) accessToken = session.access_token
    } catch {
      // fallback
    }
  }

  return { user: data.user, accessToken }
}

export async function GET() {
  try {
    const auth = await getAuthToken()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Fetch app_settings
    const settingsRes = await fetch(`${supabaseUrl}/rest/v1/app_settings?select=key,value`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${auth.accessToken}`,
      },
      cache: 'no-store',
    })
    const settingsRows: { key: string; value: string }[] = await settingsRes.json()
    const settings: Record<string, string> = {}
    for (const row of settingsRows) settings[row.key] = row.value

    // Fetch briefings (all languages, latest version)
    const briefingsRes = await fetch(
      `${supabaseUrl}/rest/v1/safety_briefings?select=language,content,version&order=language.asc`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${auth.accessToken}`,
        },
        cache: 'no-store',
      }
    )
    const briefings = await briefingsRes.json()

    return NextResponse.json({ settings, briefings })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthToken()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { settings, briefings } = body

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Upsert settings
    if (settings && typeof settings === 'object') {
      const rows = Object.entries(settings as Record<string, string>).map(([key, value]) => ({
        key,
        value: String(value),
        updated_at: new Date().toISOString(),
      }))

      const settingsRes = await fetch(`${supabaseUrl}/rest/v1/app_settings`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(rows),
      })

      if (!settingsRes.ok) {
        const err = await settingsRes.text()
        console.error('Settings upsert error:', err)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
      }
    }

    // Upsert briefings
    if (briefings && Array.isArray(briefings)) {
      for (const b of briefings) {
        const upsertRes = await fetch(`${supabaseUrl}/rest/v1/safety_briefings`, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${auth.accessToken}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=minimal',
          },
          body: JSON.stringify({
            language: b.language,
            content: b.content,
            version: b.version ?? '1.0',
            updated_at: new Date().toISOString(),
          }),
        })

        if (!upsertRes.ok) {
          const err = await upsertRes.text()
          console.error('Briefing upsert error:', err)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
