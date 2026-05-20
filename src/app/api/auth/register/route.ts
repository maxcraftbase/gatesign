import { NextRequest, NextResponse } from 'next/server'
import { generateSlug, createCompanyWithDefaults } from '@/lib/company'
import { sendEmail } from '@/lib/brevo'
import { supabaseUrl, anonKey, serviceKey } from '@/lib/supabase-server'
import { buildAvvPdf } from '@/lib/avv-pdf'
import { AVV_VERSION } from '@/lib/avv-content'

const TERMS_VERSION = '2026-05'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, companyName, termsAccepted, avvAccepted, avvVersion } = body

    if (!email || !password || !companyName) {
      return NextResponse.json({ error: 'Alle Basisfelder sind erforderlich.' }, { status: 400 })
    }
    if (!termsAccepted || !avvAccepted) {
      return NextResponse.json({ error: 'Nutzungsbedingungen, Datenschutz und AVV müssen akzeptiert werden.' }, { status: 400 })
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      ?? req.headers.get('x-real-ip')
      ?? null
    const userAgent = req.headers.get('user-agent') ?? null

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

    // 2. Create company + default settings
    const slug = generateSlug(companyName)
    const company = await createCompanyWithDefaults(companyName, slug, access_token, email)
    if (!company) {
      return NextResponse.json({ error: 'Firma konnte nicht erstellt werden.' }, { status: 500 })
    }

    // 3. Click-wrap acceptance: AVV is accepted at signup via the combined checkbox.
    //    No signature image — Annahme durch Click-Wrap mit Audit-Trail (IP, UA, Timestamp).
    const signedAt = new Date()
    const avvFields = {
      terms_accepted_at: signedAt.toISOString(),
      terms_accepted_ip: ip,
      terms_version: TERMS_VERSION,
      avv_version: avvVersion ?? AVV_VERSION,
      avv_signed_at: signedAt.toISOString(),
      avv_signature_ip: ip,
      avv_signature_user_agent: userAgent,
    }
    const patchRes = await fetch(
      `${supabaseUrl}/rest/v1/companies?id=eq.${company.id}`,
      {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(avvFields),
      }
    )
    if (!patchRes.ok) {
      console.error('[register] failed to save AVV fields:', await patchRes.text())
    }

    // 4. Audit log
    try {
      await fetch(`${supabaseUrl}/rest/v1/audit_log`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify([
          { company_id: company.id, user_email: email, action: 'terms_accepted', details: { version: TERMS_VERSION, ip } },
          { company_id: company.id, user_email: email, action: 'avv_accepted_clickwrap', details: { version: avvVersion ?? AVV_VERSION, ip, user_agent: userAgent } },
        ]),
      })
    } catch (auditErr) {
      console.error('[register] audit log failed:', auditErr)
    }

    // 5. Set auth cookie
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
    const cookieName = `sb-${projectRef}-auth-token`
    const session = { access_token, refresh_token, token_type: 'bearer' }
    const encoded = 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url')
    const cookieOpts = { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: 400 * 24 * 60 * 60 }

    // 6. Build AVV PDF + send welcome email (best-effort)
    try {
      const pdfBuffer = await buildAvvPdf({
        companyName,
        acceptedAt: signedAt,
        avvVersion: avvVersion ?? AVV_VERSION,
        acceptedByEmail: email,
        ip: ip ?? undefined,
        userAgent: userAgent ?? undefined,
      })

      const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'https://gatesign.de').replace(/\/$/, '')
      const terminalUrl = `${appUrl}/${slug}`
      const adminUrl = `${appUrl}/${slug}/admin`
      const setupUrl = `${appUrl}/einrichtung`
      await sendEmail({
        to: email,
        subject: `Willkommen bei GateSign — ${companyName}`,
        html: welcomeHtml(companyName, terminalUrl, adminUrl, setupUrl),
        attachments: [
          { name: `AVV-GateSign-${slug}.pdf`, content: pdfBuffer },
        ],
      })
    } catch (emailErr) {
      console.error('[register] welcome email/PDF failed:', emailErr)
    }

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
    console.error('[register] unexpected error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

function welcomeHtml(companyName: string, terminalUrl: string, adminUrl: string, setupUrl: string) {
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
        Ihr GateSign-Konto ist eingerichtet. Im Anhang dieser E-Mail finden Sie eine
        Kopie des Auftragsverarbeitungsvertrags (AVV) nach Art. 28 DSGVO mit Annahme-Nachweis.
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
      <a href="${setupUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;margin-bottom:24px">
        Einrichtungsanleitung öffnen →
      </a>
      <br>
      <a href="${adminUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600">
        Zum Admin-Dashboard →
      </a>
    </div>
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
      <p style="margin:0;color:#94a3b8;font-size:11px">GateSign · Bei Fragen: info@alpha-consult.one</p>
    </div>
  </div>
</body>
</html>`
}
