import { NextRequest, NextResponse } from 'next/server'
import { generateSlug, createCompanyWithDefaults } from '@/lib/company'

export async function POST(req: NextRequest) {
  try {
    const { email, password, companyName } = await req.json()
    if (!email || !password || !companyName) {
      return NextResponse.json({ error: 'Alle Felder sind erforderlich.' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // 1. Sign up user
    const signupRes = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anonKey },
      body: JSON.stringify({ email, password }),
    })

    const signupData = await signupRes.json()
    if (!signupRes.ok || !signupData.access_token) {
      return NextResponse.json(
        { error: signupData.msg ?? signupData.error_description ?? signupData.message ?? 'Registrierung fehlgeschlagen.' },
        { status: 400 }
      )
    }

    const { access_token, refresh_token } = signupData

    // 2. Create company + default settings using the new user's token
    const slug = generateSlug(companyName)
    const company = await createCompanyWithDefaults(companyName, slug, access_token, email)
    if (!company) {
      return NextResponse.json({ error: 'Firma konnte nicht erstellt werden.' }, { status: 500 })
    }

    // 3. Set auth cookie (same format as login route)
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
    const cookieName = `sb-${projectRef}-auth-token`
    const session = { access_token, refresh_token, token_type: 'bearer' }
    const encoded = 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url')
    const cookieOpts = { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: 400 * 24 * 60 * 60 }

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
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
