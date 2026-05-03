import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const language = searchParams.get('language') ?? 'de'
    const version = searchParams.get('version') ?? '1.0'

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const params = new URLSearchParams({
      language: `eq.${language}`,
      version: `eq.${version}`,
      select: 'content,version,language',
      limit: '1',
    })

    const res = await fetch(`${supabaseUrl}/rest/v1/safety_briefings?${params}`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch briefing' }, { status: 500 })
    }

    const data = await res.json()

    if (!data || data.length === 0) {
      // Fallback to German if language not found
      const fallbackParams = new URLSearchParams({
        language: 'eq.de',
        version: `eq.${version}`,
        select: 'content,version,language',
        limit: '1',
      })
      const fallbackRes = await fetch(`${supabaseUrl}/rest/v1/safety_briefings?${fallbackParams}`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        cache: 'no-store',
      })
      const fallbackData = await fallbackRes.json()
      return NextResponse.json(fallbackData[0] ?? { content: '', version: '1.0', language: 'de' })
    }

    return NextResponse.json(data[0])
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
