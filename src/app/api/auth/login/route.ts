import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    if (!checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'Zu viele Versuche. Bitte 15 Minuten warten.' }, { status: 429 })
    }

    const { email, password } = await req.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
      },
      body: JSON.stringify({ email, password }),
    })

    if (!tokenRes.ok) {
      return NextResponse.json({ error: 'E-Mail oder Passwort falsch.' }, { status: 401 })
    }

    const session = await tokenRes.json()

    const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
    const cookieName = `sb-${projectRef}-auth-token`
    const encoded = 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url')
    const cookieOpts = {
      httpOnly: true,
      secure: true,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 400 * 24 * 60 * 60,
    }

    let slug = ''
    try {
      const compRes = await fetch(`${supabaseUrl}/rest/v1/companies?select=slug&limit=1`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      })
      const compData = await compRes.json()
      slug = compData?.[0]?.slug ?? ''
    } catch { /* ignore */ }

    const response = NextResponse.json({ success: true, slug })
    const CHUNK_SIZE = 3180

    if (encoded.length > CHUNK_SIZE) {
      for (let i = 0; i * CHUNK_SIZE < encoded.length; i++) {
        response.cookies.set(`${cookieName}.${i}`, encoded.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE), cookieOpts)
      }
    } else {
      response.cookies.set(cookieName, encoded, cookieOpts)
    }

    return response
  } catch {
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
