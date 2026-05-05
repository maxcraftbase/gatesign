import { NextRequest, NextResponse } from 'next/server'
import { generateSlug, createCompanyWithDefaults } from '@/lib/company'
import { sendEmail } from '@/lib/brevo'

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

    // 4. Send welcome email (best-effort, don't fail registration)
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gatesign-production.up.railway.app'
      const terminalUrl = `${appUrl}/${slug}`
      const adminUrl = `${appUrl}/${slug}/admin`
      await sendEmail({
        to: email,
        subject: `Willkommen bei GateSign — ${companyName}`,
        html: welcomeHtml(companyName, terminalUrl, adminUrl),
      })
    } catch (emailErr) { console.error('[register] welcome email failed:', emailErr) }

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

function welcomeHtml(companyName: string, terminalUrl: string, adminUrl: string) {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;color:#0f172a">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
    <div style="background:#0f172a;padding:28px 32px">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">GateSign</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">Check-In Terminal</p>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 8px;font-size:18px">Willkommen, ${companyName}!</h2>
      <p style="color:#475569;font-size:14px;margin:0 0 24px">
        Ihr GateSign-Konto ist eingerichtet. Hier sind Ihre Zugangsdaten:
      </p>
      <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0 0 8px;font-size:13px;color:#64748b"><strong style="color:#0f172a">Check-In Terminal</strong> (für Ihre Besucher)</p>
        <a href="${terminalUrl}" style="color:#2563eb;font-size:13px">${terminalUrl}</a>
        <p style="margin:16px 0 8px;font-size:13px;color:#64748b"><strong style="color:#0f172a">Admin-Dashboard</strong> (nur für Sie)</p>
        <a href="${adminUrl}" style="color:#2563eb;font-size:13px">${adminUrl}</a>
      </div>
      <p style="color:#475569;font-size:13px;margin:0 0 12px">
        Die vollständige <strong>Einrichtungsanleitung</strong> (iPad, Windows, Android) finden Sie hier:
      </p>
      <a href="https://gatesign-production.up.railway.app/einrichtung" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;margin-bottom:24px">
        Einrichtungsanleitung öffnen →
      </a>
      <br>
      <a href="${adminUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600">
        Zum Admin-Dashboard →
      </a>
    </div>
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
      <p style="margin:0;color:#94a3b8;font-size:11px">GateSign · Bei Fragen: support@gatesign.app</p>
    </div>
  </div>
</body>
</html>`
}
