import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/drivers?device_token=eq.${encodeURIComponent(token)}&select=id,name,company_name,phone,license_plate,trailer_plate,preferred_language`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
    }
  )

  if (!res.ok) return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
  const [driver] = await res.json()
  if (!driver) return NextResponse.json(null)
  return NextResponse.json(driver)
}
