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

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Get access token from cookies
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
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
        // fallback
      }
    }

    const params = new URLSearchParams({
      select: 'id,created_at,driver_name,company_name,license_plate,phone,language,briefing_accepted,briefing_accepted_at,has_signature,reference_number',
      order: 'created_at.desc',
      limit: '10000',
    })

    const res = await fetch(`${supabaseUrl}/rest/v1/check_ins?${params}`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }

    const data: Record<string, unknown>[] = await res.json()

    const headers = [
      'ID', 'Datum/Zeit', 'Fahrer', 'Firma', 'Kennzeichen', 'Telefon',
      'Sprache', 'Belehrung', 'Belehrung-Zeit', 'Unterschrift', 'Referenz'
    ]

    const rows = data.map(row => [
      escapeCSV(row.id),
      escapeCSV(row.created_at),
      escapeCSV(row.driver_name),
      escapeCSV(row.company_name),
      escapeCSV(row.license_plate),
      escapeCSV(row.phone),
      escapeCSV(row.language),
      escapeCSV(row.briefing_accepted ? 'Ja' : 'Nein'),
      escapeCSV(row.briefing_accepted_at),
      escapeCSV(row.has_signature ? 'Ja' : 'Nein'),
      escapeCSV(row.reference_number),
    ].join(','))

    const csv = [headers.join(','), ...rows].join('\n')
    const bom = '\uFEFF' // UTF-8 BOM for Excel

    return new NextResponse(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="gatesign-checkins-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
