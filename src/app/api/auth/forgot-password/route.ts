import { NextRequest, NextResponse } from 'next/server'
import { supabaseUrl, anonKey } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'E-Mail erforderlich.' }, { status: 400 })
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'

    await fetch(`${supabaseUrl}/auth/v1/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anonKey },
      body: JSON.stringify({ email, redirect_to: `${appUrl}/reset-password` }),
    })

    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[forgot-password] error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
