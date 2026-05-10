import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { supabaseUrl, serviceKey } from '@/lib/supabase-server'

// GET: which user_ids have access to this terminal
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: terminalId } = await params

  // Verify terminal belongs to this company
  const termRes = await fetch(
    `${supabaseUrl}/rest/v1/terminals?id=eq.${terminalId}&company_id=eq.${ctx.company.id}&select=id&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  const termRows: { id: string }[] = termRes.ok ? await termRes.json() : []
  if (!termRows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const res = await fetch(
    `${supabaseUrl}/rest/v1/user_terminal_access?terminal_id=eq.${terminalId}&company_id=eq.${ctx.company.id}&select=user_id`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  const rows: { user_id: string }[] = res.ok ? await res.json() : []
  return NextResponse.json({ user_ids: rows.map(r => r.user_id) })
}

// PUT: replace the full access list for this terminal
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: terminalId } = await params
  const { user_ids } = await req.json() as { user_ids: string[] }

  // Verify terminal belongs to this company
  const termRes = await fetch(
    `${supabaseUrl}/rest/v1/terminals?id=eq.${terminalId}&company_id=eq.${ctx.company.id}&select=id&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  const termRows: { id: string }[] = termRes.ok ? await termRes.json() : []
  if (!termRows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete existing access for this terminal
  await fetch(`${supabaseUrl}/rest/v1/user_terminal_access?terminal_id=eq.${terminalId}&company_id=eq.${ctx.company.id}`, {
    method: 'DELETE',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  })

  // Insert new access entries
  if (user_ids.length > 0) {
    const rows = user_ids.map(uid => ({ user_id: uid, terminal_id: terminalId, company_id: ctx.company.id }))
    await fetch(`${supabaseUrl}/rest/v1/user_terminal_access`, {
      method: 'POST',
      headers: {
        apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json', Prefer: 'return=minimal',
      },
      body: JSON.stringify(rows),
    })
  }

  return NextResponse.json({ success: true })
}
