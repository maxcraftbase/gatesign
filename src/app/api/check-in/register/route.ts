import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(req: NextRequest) {
  const { name, company_name, phone, license_plate, trailer_plate, preferred_language, device_token } = await req.json()

  if (!name || !company_name || !phone || !license_plate || !device_token) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/drivers`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      name,
      company_name,
      phone,
      license_plate,
      trailer_plate: trailer_plate || null,
      preferred_language: preferred_language || 'de',
      device_token,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  const [driver] = await res.json()
  return NextResponse.json(driver)
}
