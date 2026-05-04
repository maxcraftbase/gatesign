import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/brevo'

const appUrl = 'https://gatesign-production.up.railway.app'
const companyName = 'Rüther Logistik'
const slug = 'ruether-logistik-p7vl'
const kioskUrl = `${appUrl}/${slug}`
const adminUrl = `${appUrl}/${slug}/admin`

function welcomeHtml() {
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
        <a href="${kioskUrl}" style="color:#2563eb;font-size:13px">${kioskUrl}</a>
        <p style="margin:16px 0 8px;font-size:13px;color:#64748b"><strong style="color:#0f172a">Admin-Dashboard</strong> (nur für Sie)</p>
        <a href="${adminUrl}" style="color:#2563eb;font-size:13px">${adminUrl}</a>
      </div>
      <p style="color:#475569;font-size:13px;margin:0 0 12px">
        Die vollständige <strong>Einrichtungsanleitung</strong> (iPad, Windows, Android) finden Sie hier:
      </p>
      <a href="${appUrl}/einrichtung" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;margin-bottom:24px">
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

export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get('to') ?? 'info@craft-base.de'
  try {
    await sendEmail({ to, subject: `Willkommen bei GateSign — ${companyName}`, html: welcomeHtml() })
    return NextResponse.json({ ok: true, to })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
