import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const driverId = searchParams.get('driverId')
  const siteId = searchParams.get('siteId')
  const briefingVersion = searchParams.get('briefingVersion')

  if (!driverId || !siteId || !briefingVersion) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/briefing_confirmations?driver_id=eq.${driverId}&site_id=eq.${siteId}&briefing_version=eq.${briefingVersion}&select=confirmed_at`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
    }
  )

  if (!res.ok) return NextResponse.json(null)
  const [confirmation] = await res.json()
  return NextResponse.json(confirmation ?? null)
}
