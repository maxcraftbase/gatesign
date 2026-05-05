import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { token_hash, password } = await req.json()
    if (!token_hash || !password) {
      return NextResponse.json({ error: 'Token und Passwort erforderlich.' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // 1. Verify the recovery token → get session
    const verifyRes = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anonKey },
      body: JSON.stringify({ token_hash, type: 'recovery' }),
    })
    if (!verifyRes.ok) {
      return NextResponse.json({ error: 'Ungültiger oder abgelaufener Link.' }, { status: 400 })
    }
    const { access_token } = await verifyRes.json()

    // 2. Update password
    const updateRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${access_token}` },
      body: JSON.stringify({ password }),
    })
    if (!updateRes.ok) {
      return NextResponse.json({ error: 'Passwort konnte nicht gesetzt werden.' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
