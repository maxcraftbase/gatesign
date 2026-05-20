import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { supabaseUrl, serviceKey } from '@/lib/supabase-server'

export async function GET() {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch phone from auth user metadata
  const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${ctx.userId}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: 'no-store',
  })
  const authUser = authRes.ok ? await authRes.json() as { user_metadata?: { phone?: string } } : null
  const phone = authUser?.user_metadata?.phone ?? ''

  return NextResponse.json({ name: ctx.name ?? '', email: ctx.email, phone })
}

export async function PUT(req: NextRequest) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, email, phone, newPassword } = await req.json() as {
    name?: string
    email?: string
    phone?: string
    newPassword?: string
  }

  const errors: string[] = []

  // Update name in company_users
  if (name !== undefined) {
    const nameRes = await fetch(
      `${supabaseUrl}/rest/v1/company_users?user_id=eq.${ctx.userId}&company_id=eq.${ctx.company.id}`,
      {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ name: name.trim() || null }),
      }
    )
    if (!nameRes.ok) errors.push('Name konnte nicht gespeichert werden.')
  }

  // Update email, phone, password via auth admin API
  const authUpdate: Record<string, unknown> = {}
  if (email && email !== ctx.email) {
    // RFC 5321: max 254 chars. Längen-Check vor Regex bremst potentielle ReDoS-Inputs aus.
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 })
    }
    authUpdate.email = email.trim()
    // Sync email in company_users too
    await fetch(
      `${supabaseUrl}/rest/v1/company_users?user_id=eq.${ctx.userId}&company_id=eq.${ctx.company.id}`,
      {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ email: email.trim() }),
      }
    )
  }
  if (phone !== undefined) {
    authUpdate.user_metadata = { phone: phone.trim() }
  }
  if (newPassword) {
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Passwort muss mindestens 8 Zeichen lang sein.' }, { status: 400 })
    }
    authUpdate.password = newPassword
  }

  if (Object.keys(authUpdate).length > 0) {
    const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${ctx.userId}`, {
      method: 'PUT',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(authUpdate),
    })
    if (!authRes.ok) {
      const err = await authRes.json() as { msg?: string; message?: string }
      errors.push(err.msg ?? err.message ?? 'Kontoänderung fehlgeschlagen.')
    }
  }

  if (errors.length > 0) return NextResponse.json({ error: errors.join(' ') }, { status: 500 })
  return NextResponse.json({ ok: true })
}
