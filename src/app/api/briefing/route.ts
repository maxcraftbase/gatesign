import { NextRequest, NextResponse } from 'next/server'
import { getCompanyBySlug } from '@/lib/company'

async function fetchBriefing(supabaseUrl: string, anonKey: string, companyId: string, language: string, visitorType: string, version: string) {
  const params = new URLSearchParams({
    company_id: `eq.${companyId}`,
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
    const slug = searchParams.get('slug') ?? ''
    const language = searchParams.get('language') ?? 'de'
    const visitorType = searchParams.get('visitor_type') ?? 'truck'
    const version = searchParams.get('version') ?? '1.0'

    const company = await getCompanyBySlug(slug)
    if (!company) return NextResponse.json({ content: '', version: '1.0' })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    let briefing = await fetchBriefing(supabaseUrl, anonKey, company.id, language, visitorType, version)
    if (!briefing) briefing = await fetchBriefing(supabaseUrl, anonKey, company.id, 'de', visitorType, version)
    if (!briefing) briefing = await fetchBriefing(supabaseUrl, anonKey, company.id, language, 'truck', version)
    if (!briefing) briefing = await fetchBriefing(supabaseUrl, anonKey, company.id, 'de', 'truck', version)

    return NextResponse.json(briefing ?? { content: '', version: '1.0', language: 'de', visitor_type: 'truck' })
  } catch (err) {
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
