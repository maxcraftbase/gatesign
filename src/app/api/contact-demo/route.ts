import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/brevo'
import { checkRateLimitAsync } from '@/lib/rate-limit'

const RECIPIENT = 'info@gatesign.de'
const MAX_FIELD_LENGTH = 1000

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function clean(v: unknown): string {
  if (typeof v !== 'string') return ''
  return v.trim().slice(0, MAX_FIELD_LENGTH)
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const allowed = await checkRateLimitAsync(`contact-demo:${ip}`, 3, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte später erneut versuchen.' },
      { status: 429 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const name = clean(body.name)
  const company = clean(body.company)
  const email = clean(body.email)
  const role = clean(body.role)
  const phone = clean(body.phone)
  const sites = clean(body.sites)
  const message = clean(body.message)
  const lang = body.lang === 'en' ? 'en' : 'de'

  if (!name || !company || !email) {
    return NextResponse.json({ error: 'Bitte Name, Firma und E-Mail angeben.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Ungültige E-Mail-Adresse.' }, { status: 400 })
  }

  const subjectPrefix = lang === 'en' ? 'GateSign demo request' : 'Demo-Anfrage GateSign'
  const subject = `${subjectPrefix} — ${company}`

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;color:#0f172a">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
    <div style="background:#0f172a;padding:20px 24px">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700">Neue Demo-Anfrage</h1>
    </div>
    <div style="padding:24px">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#64748b;width:140px">Name</td><td style="padding:6px 0;font-weight:600">${esc(name)}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Firma</td><td style="padding:6px 0;font-weight:600">${esc(company)}</td></tr>
        ${role ? `<tr><td style="padding:6px 0;color:#64748b">Funktion</td><td style="padding:6px 0">${esc(role)}</td></tr>` : ''}
        <tr><td style="padding:6px 0;color:#64748b">E-Mail</td><td style="padding:6px 0"><a href="mailto:${esc(email)}" style="color:#2563eb">${esc(email)}</a></td></tr>
        ${phone ? `<tr><td style="padding:6px 0;color:#64748b">Telefon</td><td style="padding:6px 0">${esc(phone)}</td></tr>` : ''}
        ${sites ? `<tr><td style="padding:6px 0;color:#64748b">Standorte</td><td style="padding:6px 0">${esc(sites)}</td></tr>` : ''}
        <tr><td style="padding:6px 0;color:#64748b">Sprache</td><td style="padding:6px 0">${lang.toUpperCase()}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">IP</td><td style="padding:6px 0;color:#94a3b8;font-family:monospace;font-size:12px">${esc(ip)}</td></tr>
      </table>
      ${message ? `<div style="margin-top:16px;padding:12px 16px;background:#f8fafc;border-radius:8px;border-left:3px solid #2563eb;font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(message)}</div>` : ''}
    </div>
  </div>
</body></html>`

  try {
    await sendEmail({ to: RECIPIENT, subject, html })
  } catch (err) {
    console.error('[contact-demo] sendEmail failed:', err)
    return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
