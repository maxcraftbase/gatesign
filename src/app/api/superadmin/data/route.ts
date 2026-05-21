import { NextRequest, NextResponse } from 'next/server'
import { isSuperadminAuthorized } from '@/lib/superadmin-auth'
import { supabaseUrl, serviceKey } from '@/lib/supabase-server'
import { applyPlan, type PlanName } from '@/lib/subscription'

export async function GET(req: NextRequest) {
  if (!isSuperadminAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }

  const [companiesRes, checkInsRes, terminalsRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/companies?select=id,name,slug,email,subscription_status,trial_ends_at,created_at,plan,terminal_limit&order=created_at.desc`, {
      headers, cache: 'no-store',
    }),
    fetch(`${supabaseUrl}/rest/v1/check_ins?select=company_id,created_at`, {
      headers, cache: 'no-store',
    }),
    fetch(`${supabaseUrl}/rest/v1/terminals?select=company_id,is_active`, {
      headers, cache: 'no-store',
    }),
  ])

  if (!companiesRes.ok || !checkInsRes.ok || !terminalsRes.ok) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const companies = await companiesRes.json()
  const checkIns: { company_id: string; created_at: string }[] = await checkInsRes.json()
  const terminals: { company_id: string; is_active: boolean }[] = await terminalsRes.json()

  const now = Date.now()
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)

  const recentCheckIns = checkIns.filter(ci => ci.created_at > sevenDaysAgo)
  const checkInsToday = checkIns.filter(ci => ci.created_at >= todayStart.toISOString()).length
  const newThisWeek = companies.filter((c: { created_at: string }) => c.created_at > sevenDaysAgo).length

  type RawCompany = {
    id: string; name: string; slug: string; email: string
    subscription_status: string | null; trial_ends_at: string | null; created_at: string
    plan: string | null; terminal_limit: number | null
  }

  const stats = companies.map((c: RawCompany) => {
    const companyCheckIns = checkIns.filter(ci => ci.company_id === c.id)
    const checkIns7d = recentCheckIns.filter(ci => ci.company_id === c.id).length
    const lastCheckIn = companyCheckIns.length > 0
      ? companyCheckIns.reduce((a, b) => a.created_at > b.created_at ? a : b).created_at
      : null
    const active_terminal_count = terminals.filter(t => t.company_id === c.id && t.is_active).length

    const daily_7d = Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(now - (6 - i) * 86400000)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart.getTime() + 86400000)
      return companyCheckIns.filter(
        ci => ci.created_at >= dayStart.toISOString() && ci.created_at < dayEnd.toISOString()
      ).length
    })

    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      email: c.email,
      subscription_status: c.subscription_status ?? 'inactive',
      trial_ends_at: c.trial_ends_at,
      created_at: c.created_at,
      plan: c.plan ?? 'solo',
      terminal_limit: c.terminal_limit,
      total_check_ins: companyCheckIns.length,
      check_ins_7d: checkIns7d,
      last_check_in: lastCheckIn,
      active_terminal_count,
      daily_7d,
    }
  })

  return NextResponse.json({
    companies: stats,
    total_check_ins: checkIns.length,
    check_ins_today: checkInsToday,
    new_this_week: newThisWeek,
  })
}

export async function PATCH(req: NextRequest) {
  if (!isSuperadminAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { companyId, subscription_status, trial_ends_at, plan } = await req.json()

  const update: Record<string, unknown> = {}
  if (subscription_status !== undefined) update.subscription_status = subscription_status
  if (trial_ends_at !== undefined) update.trial_ends_at = trial_ends_at

  // Plan change: routes through applyPlan() so Stripe webhook can use the same path later
  if (plan !== undefined) {
    const validPlans: PlanName[] = ['solo', 'business', 'enterprise']
    if (!validPlans.includes(plan)) return NextResponse.json({ error: 'Ungültiger Plan' }, { status: 400 })
    const ok = await applyPlan(companyId, plan as PlanName)
    if (!ok) return NextResponse.json({ error: 'Plan-Update fehlgeschlagen' }, { status: 500 })
    if (Object.keys(update).length === 0) return NextResponse.json({ success: true })
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Keine Felder zum Aktualisieren' }, { status: 400 })
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/companies?id=eq.${companyId}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(update),
  })

  if (!res.ok) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}
