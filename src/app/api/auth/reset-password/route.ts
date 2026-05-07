import { NextRequest, NextResponse } from 'next/server'
import { supabaseUrl, anonKey } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { token_hash, access_token: directToken, password } = await req.json()
    if ((!token_hash && !directToken) || !password) {
      return NextResponse.json({ error: 'Token und Passwort erforderlich.' }, { status: 400 })
    }
    let accessToken: string = directToken ?? ''

    if (!directToken) {
      // Forgot-password flow: verify token_hash → get access_token
      const verifyRes = await fetch(`${supabaseUrl}/auth/v1/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anonKey },
        body: JSON.stringify({ token_hash, type: 'recovery' }),
      })
      if (!verifyRes.ok) {
        return NextResponse.json({ error: 'Ungültiger oder abgelaufener Link.' }, { status: 400 })
      }
      const data = await verifyRes.json()
      accessToken = data.access_token
    }

    // Update password using the access token
    const updateRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ password }),
    })
    if (!updateRes.ok) {
      return NextResponse.json({ error: 'Passwort konnte nicht gesetzt werden.' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[reset-password] error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
