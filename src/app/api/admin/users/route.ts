import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { logAction } from '@/lib/audit'
import { sendEmail } from '@/lib/brevo'

export async function GET() {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const res = await fetch(
    `${supabaseUrl}/rest/v1/company_users?company_id=eq.${ctx.company.id}&order=created_at.asc&select=id,email,name,role,status,created_at,last_login_at`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  const users = await res.json()
  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, name, role } = await req.json() as { email: string; name?: string; role: 'admin' | 'member' }
  if (!email || !role) return NextResponse.json({ error: 'E-Mail und Rolle erforderlich' }, { status: 400 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // Check if user already exists in this company
  const existing = await fetch(
    `${supabaseUrl}/rest/v1/company_users?company_id=eq.${ctx.company.id}&email=eq.${encodeURIComponent(email)}&select=id`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  const existingRows = await existing.json()
  if (existingRows.length > 0) return NextResponse.json({ error: 'Nutzer bereits eingeladen' }, { status: 409 })

  // Create pending company_users entry
  const insertRes = await fetch(`${supabaseUrl}/rest/v1/company_users`, {
    method: 'POST',
    headers: {
      apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      company_id: ctx.company.id,
      email: email.toLowerCase().trim(),
      name: name ?? null,
      role,
      status: 'pending',
      invited_by: ctx.userId,
    }),
  })
  if (!insertRes.ok) return NextResponse.json({ error: 'Fehler beim Anlegen' }, { status: 500 })

  // Generate invite link via Supabase (does not send email)
  const linkRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: {
      apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'invite', email: email.toLowerCase().trim() }),
  })

  let inviteUrl: string | null = null
  if (linkRes.ok) {
    const linkData = await linkRes.json() as { action_link?: string }
    inviteUrl = linkData.action_link ?? null
  } else {
    const errBody = await linkRes.text()
    // User already exists in Supabase Auth — they can log in with their existing password
    if (!errBody.includes('already registered')) {
      return NextResponse.json({ error: 'Einladungsmail konnte nicht gesendet werden' }, { status: 500 })
    }
  }

  // Send invite email via Brevo
  if (inviteUrl) {
    await sendEmail({
      to: email.toLowerCase().trim(),
      subject: `Einladung zu GateSign – ${ctx.company.name}`,
      html: inviteHtml(name ?? null, ctx.company.name, inviteUrl),
    }).catch(() => { /* Brevo failure is non-fatal; user is already created */ })
  }

  await logAction(ctx, 'user_invited', { invited_email: email, role })
  return NextResponse.json({ success: true })
}

function inviteHtml(name: string | null, companyName: string, inviteUrl: string) {
  const greeting = name ? `Hallo ${name}` : 'Hallo'
  const roleLabel = inviteUrl ? 'Mitarbeiter' : 'Nutzer'
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;color:#0f172a">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">

    <div style="background:#0f172a;padding:28px 32px">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.3px">GateSign</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">Check-In Terminal</p>
    </div>

    <div style="padding:32px">
      <h2 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0f172a">${greeting},</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6">
        Du wurdest von <strong style="color:#0f172a">${companyName}</strong> zu GateSign eingeladen.<br>
        Klicke auf den Button unten, um deinen Account zu aktivieren und ein Passwort festzulegen.
      </p>

      <a href="${inviteUrl}"
         style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:-0.2px">
        Account aktivieren →
      </a>

      <div style="margin-top:28px;padding:16px 20px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
        <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6">
          <strong style="color:#0f172a">Hinweis:</strong> Dieser Link ist 24 Stunden gültig.
          Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
          <span style="color:#2563eb;word-break:break-all">${inviteUrl}</span>
        </p>
      </div>

      <p style="margin:24px 0 0;font-size:13px;color:#94a3b8">
        Falls du diese Einladung nicht erwartet hast, kannst du diese E-Mail ignorieren.
      </p>
    </div>

    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
      <p style="margin:0;color:#94a3b8;font-size:11px">GateSign · Bei Fragen: info@alpha-consult.one</p>
    </div>

  </div>
</body>
</html>`
  void roleLabel
}
