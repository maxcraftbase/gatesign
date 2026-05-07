import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { supabaseUrl, serviceKey } from '@/lib/supabase-server'

const ACTION_LABELS: Record<string, string> = {
  settings_saved: 'Einstellungen gespeichert',
  note_saved: 'Notiz bearbeitet',
  entry_printed: 'Eintrag gedruckt',
  user_invited: 'Nutzer eingeladen',
  user_role_changed: 'Rolle geändert',
  user_removed: 'Nutzer entfernt',
}

export async function GET(req: NextRequest) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '50')

  const params = new URLSearchParams({
    company_id: `eq.${ctx.company.id}`,
    order: 'created_at.desc',
    limit: String(limit),
    select: 'id,user_email,action,details,created_at',
  })

  const res = await fetch(`${supabaseUrl}/rest/v1/audit_log?${params}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: 'no-store',
  })

  const rows: { id: string; user_email: string; action: string; details: Record<string, unknown> | null; created_at: string }[] = await res.json()

  // Fetch names for all unique emails in one request
  const uniqueEmails = [...new Set(rows.map(r => r.user_email).filter(Boolean))]
  let nameMap: Record<string, string> = {}
  if (uniqueEmails.length > 0) {
    const emailFilter = uniqueEmails.map(e => encodeURIComponent(e)).join(',')
    const usersRes = await fetch(
      `${supabaseUrl}/rest/v1/company_users?company_id=eq.${ctx.company.id}&email=in.(${emailFilter})&select=email,name`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
    )
    const userRows: { email: string; name: string | null }[] = await usersRes.json()
    nameMap = Object.fromEntries(userRows.filter(u => u.name).map(u => [u.email, u.name!]))
  }

  const entries = rows.map(r => ({
    ...r,
    action_label: ACTION_LABELS[r.action] ?? r.action,
    user_name: nameMap[r.user_email] ?? null,
  }))

  return NextResponse.json({ entries })
}
