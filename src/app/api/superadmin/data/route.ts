import { NextRequest, NextResponse } from 'next/server'
import { isSuperadminAuthorized } from '@/lib/superadmin-auth'

export async function GET(req: NextRequest) {
  if (!isSuperadminAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }

  const [companiesRes, checkInsRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/companies?select=id,name,slug,email,subscription_status,trial_ends_at,created_at&order=created_at.desc`, {
      headers, cache: 'no-store',
    }),
    fetch(`${supabaseUrl}/rest/v1/check_ins?select=company_id,created_at`, {
      headers, cache: 'no-store',
    }),
  ])

  if (!companiesRes.ok || !checkInsRes.ok) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const companies = await companiesRes.json()
  const checkIns: { company_id: string; created_at: string }[] = await checkInsRes.json()

  const now = Date.now()
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)

  const recentCheckIns = checkIns.filter(ci => ci.created_at > sevenDaysAgo)
  const checkInsToday = checkIns.filter(ci => ci.created_at >= todayStart.toISOString()).length
  const newThisWeek = companies.filter((c: { created_at: string }) => c.created_at > sevenDaysAgo).length

  type RawCompany = {
    id: string; name: string; slug: string; email: string
    subscription_status: string | null; trial_ends_at: string | null; created_at: string
  }

  const stats = companies.map((c: RawCompany) => {
    const companyCheckIns = checkIns.filter(ci => ci.company_id === c.id)
    const checkIns7d = recentCheckIns.filter(ci => ci.company_id === c.id).length
    const lastCheckIn = companyCheckIns.length > 0
      ? companyCheckIns.reduce((a, b) => a.created_at > b.created_at ? a : b).created_at
      : null
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      email: c.email,
      subscription_status: c.subscription_status ?? 'inactive',
      trial_ends_at: c.trial_ends_at,
      created_at: c.created_at,
      total_check_ins: companyCheckIns.length,
      check_ins_7d: checkIns7d,
      last_check_in: lastCheckIn,
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const { companyId, subscription_status, trial_ends_at } = await req.json()

  const update: Record<string, unknown> = {}
  if (subscription_status !== undefined) update.subscription_status = subscription_status
  if (trial_ends_at !== undefined) update.trial_ends_at = trial_ends_at

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
