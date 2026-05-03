import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getUser() {
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
  return data.user
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = 50
    const offset = (page - 1) * limit

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Get the auth token from cookies to use authenticated requests
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    // Find the sb-*-auth-token cookie
    const authCookieName = allCookies.find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))?.name
    let accessToken = anonKey

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
        // fallback to anon key
      }
    }

    const params = new URLSearchParams({
      select: 'id,created_at,driver_name,company_name,license_plate,phone,language,briefing_accepted,briefing_accepted_at,has_signature,reference_number',
      order: 'created_at.desc',
      limit: String(limit),
      offset: String(offset),
    })

    const res = await fetch(`${supabaseUrl}/rest/v1/check_ins?${params}`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'count=exact',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Entries fetch error:', err)
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
    }

    const data = await res.json()
    const contentRange = res.headers.get('content-range')
    const total = contentRange ? parseInt(contentRange.split('/')[1]) : 0

    return NextResponse.json({ entries: data, total, page, limit })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
