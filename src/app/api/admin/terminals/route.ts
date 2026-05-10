import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { generateSlug } from '@/lib/company'
import { getCompanyPlan, PLAN_LIMITS } from '@/lib/subscription'
import { supabaseUrl, serviceKey } from '@/lib/supabase-server'

export async function GET() {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch(
    `${supabaseUrl}/rest/v1/terminals?company_id=eq.${ctx.company.id}&order=sort_order.asc,created_at.asc&select=id,name,slug,is_active,sort_order,created_at`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  if (!res.ok) return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  const terminals = await res.json()

  const planInfo = await getCompanyPlan(ctx.company.id)
  return NextResponse.json({
    terminals,
    plan: planInfo?.plan ?? 'starter',
    terminal_limit: planInfo ? planInfo.terminal_limit : 1,
  })
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name } = await req.json() as { name?: string }
  if (!name?.trim()) return NextResponse.json({ error: 'Name erforderlich' }, { status: 400 })

  // Check plan limit
  const planInfo = await getCompanyPlan(ctx.company.id)
  const limit = planInfo ? planInfo.terminal_limit : PLAN_LIMITS['starter'].terminal_limit
  if (limit !== null) {
    const countRes = await fetch(
      `${supabaseUrl}/rest/v1/terminals?company_id=eq.${ctx.company.id}&is_active=eq.true&select=id`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Prefer: 'count=exact' }, cache: 'no-store' }
    )
    const total = parseInt(countRes.headers.get('content-range')?.split('/')[1] ?? '0')
    if (total >= limit) {
      return NextResponse.json({
        error: 'plan_limit_reached',
        plan: planInfo?.plan ?? 'starter',
        limit,
      }, { status: 403 })
    }
  }

  // Generate unique slug within company
  const baseSlug = generateSlug(name.trim()).replace(/-[a-z0-9]{4}$/, '') // strip random suffix
  let slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`

  // Get current max sort_order
  const listRes = await fetch(
    `${supabaseUrl}/rest/v1/terminals?company_id=eq.${ctx.company.id}&order=sort_order.desc&select=sort_order&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  const listRows: { sort_order: number }[] = listRes.ok ? await listRes.json() : []
  const nextOrder = (listRows[0]?.sort_order ?? -1) + 1

  const insertRes = await fetch(`${supabaseUrl}/rest/v1/terminals`, {
    method: 'POST',
    headers: {
      apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json', Prefer: 'return=representation',
    },
    body: JSON.stringify({ company_id: ctx.company.id, name: name.trim(), slug, is_active: true, sort_order: nextOrder }),
  })

  // On slug collision retry once with a different suffix
  if (!insertRes.ok) {
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    const retryRes = await fetch(`${supabaseUrl}/rest/v1/terminals`, {
      method: 'POST',
      headers: {
        apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json', Prefer: 'return=representation',
      },
      body: JSON.stringify({ company_id: ctx.company.id, name: name.trim(), slug, is_active: true, sort_order: nextOrder }),
    })
    if (!retryRes.ok) return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 })
    const [terminal] = await retryRes.json()
    return NextResponse.json({ terminal })
  }

  const [terminal] = await insertRes.json()
  return NextResponse.json({ terminal })
}
