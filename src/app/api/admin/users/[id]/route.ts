import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { logAction } from '@/lib/audit'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { role } = await req.json() as { role: 'admin' | 'member' }
  if (!role) return NextResponse.json({ error: 'Rolle erforderlich' }, { status: 400 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // Verify belongs to this company
  const check = await fetch(
    `${supabaseUrl}/rest/v1/company_users?id=eq.${id}&company_id=eq.${ctx.company.id}&select=id,email`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  const rows: { id: string; email: string }[] = await check.json()
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await fetch(`${supabaseUrl}/rest/v1/company_users?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal',
    },
    body: JSON.stringify({ role }),
  })

  await logAction(ctx, 'user_role_changed', { target_email: rows[0].email, new_role: role })
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const check = await fetch(
    `${supabaseUrl}/rest/v1/company_users?id=eq.${id}&company_id=eq.${ctx.company.id}&select=id,email,user_id`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  const rows: { id: string; email: string; user_id: string }[] = await check.json()
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // Prevent removing yourself
  if (rows[0].user_id === ctx.userId) return NextResponse.json({ error: 'Eigener Account kann nicht entfernt werden' }, { status: 400 })

  await fetch(`${supabaseUrl}/rest/v1/company_users?id=eq.${id}`, {
    method: 'DELETE',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Prefer: 'return=minimal' },
  })

  await logAction(ctx, 'user_removed', { removed_email: rows[0].email })
  return NextResponse.json({ success: true })
}
