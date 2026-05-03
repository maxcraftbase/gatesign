import { NextRequest, NextResponse } from 'next/server'

async function fetchBriefing(supabaseUrl: string, anonKey: string, language: string, visitorType: string, version: string) {
  const params = new URLSearchParams({
    language: `eq.${language}`,
    visitor_type: `eq.${visitorType}`,
    version: `eq.${version}`,
    select: 'content,version,language,visitor_type',
    limit: '1',
  })
  const res = await fetch(`${supabaseUrl}/rest/v1/safety_briefings?${params}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = await res.json()
  return data?.[0] ?? null
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const language = searchParams.get('language') ?? 'de'
    const visitorType = searchParams.get('visitor_type') ?? 'truck'
    const version = searchParams.get('version') ?? '1.0'

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Try exact match first
    let briefing = await fetchBriefing(supabaseUrl, anonKey, language, visitorType, version)
    // Fallback 1: same visitor type but German
    if (!briefing) briefing = await fetchBriefing(supabaseUrl, anonKey, 'de', visitorType, version)
    // Fallback 2: truck type in requested language
    if (!briefing) briefing = await fetchBriefing(supabaseUrl, anonKey, language, 'truck', version)
    // Fallback 3: German truck
    if (!briefing) briefing = await fetchBriefing(supabaseUrl, anonKey, 'de', 'truck', version)

    return NextResponse.json(briefing ?? { content: '', version: '1.0', language: 'de', visitor_type: 'truck' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
