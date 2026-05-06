import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { logAction } from '@/lib/audit'

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

  // Send invite via Supabase Auth
  const inviteRes = await fetch(`${supabaseUrl}/auth/v1/invite`, {
    method: 'POST',
    headers: {
      apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: email.toLowerCase().trim() }),
  })
  if (!inviteRes.ok) {
    const errBody = await inviteRes.text()
    // If user already exists in Supabase Auth, that's OK — they'll just log in
    if (!errBody.includes('already registered')) {
      return NextResponse.json({ error: 'Einladungsmail konnte nicht gesendet werden' }, { status: 500 })
    }
  }

  await logAction(ctx, 'user_invited', { invited_email: email, role })
  return NextResponse.json({ success: true })
}
