import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { supabaseUrl, serviceKey } from '@/lib/supabase-server'

async function ownsTerminal(companyId: string, terminalId: string): Promise<boolean> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/terminals?id=eq.${terminalId}&company_id=eq.${companyId}&select=id&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  if (!res.ok) return false
  const rows: { id: string }[] = await res.json()
  return rows.length > 0
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  if (!await ownsTerminal(ctx.company.id, id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json() as { name?: string; is_active?: boolean; sort_order?: number }
  const update: Record<string, unknown> = {}
  if (body.name !== undefined)       update.name = body.name.trim()
  if (body.is_active !== undefined)  update.is_active = body.is_active
  if (body.sort_order !== undefined) update.sort_order = body.sort_order

  if (!Object.keys(update).length) return NextResponse.json({ error: 'Keine Felder' }, { status: 400 })

  const res = await fetch(`${supabaseUrl}/rest/v1/terminals?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json', Prefer: 'return=representation',
    },
    body: JSON.stringify(update),
  })
  if (!res.ok) return NextResponse.json({ error: 'Update fehlgeschlagen' }, { status: 500 })
  const [terminal] = await res.json()
  return NextResponse.json({ terminal })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  if (!await ownsTerminal(ctx.company.id, id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Prevent deleting the last active terminal
  const countRes = await fetch(
    `${supabaseUrl}/rest/v1/terminals?company_id=eq.${ctx.company.id}&is_active=eq.true&select=id`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Prefer: 'count=exact' }, cache: 'no-store' }
  )
  const total = parseInt(countRes.headers.get('content-range')?.split('/')[1] ?? '0')
  if (total <= 1) {
    return NextResponse.json({ error: 'Das letzte Terminal kann nicht gelöscht werden.' }, { status: 409 })
  }

  // Nullify terminal_id on linked check_ins before deleting
  await fetch(`${supabaseUrl}/rest/v1/check_ins?terminal_id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal',
    },
    body: JSON.stringify({ terminal_id: null }),
  })

  // Remove terminal access entries
  await fetch(`${supabaseUrl}/rest/v1/user_terminal_access?terminal_id=eq.${id}`, {
    method: 'DELETE',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  })

  const res = await fetch(`${supabaseUrl}/rest/v1/terminals?id=eq.${id}`, {
    method: 'DELETE',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Prefer: 'return=minimal' },
  })
  if (!res.ok) return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 })
  return NextResponse.json({ success: true })
}
