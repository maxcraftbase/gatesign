import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

function hashPassword(pw: string) {
  return createHash('sha256').update(pw + 'gs-salt-2025').digest('hex')
}

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.SUPERADMIN_PASSWORD?.trim()
  if (!expected) return false
  const token = req.cookies.get('gs-superadmin')?.value
  return token === hashPassword(expected)
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const stats = companies.map((c: { id: string; name: string; slug: string; email: string; subscription_status: string | null; trial_ends_at: string | null; created_at: string }) => {
    const companyCheckIns = checkIns.filter(ci => ci.company_id === c.id)
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
      last_check_in: lastCheckIn,
    }
  })

  return NextResponse.json({ companies: stats, total_check_ins: checkIns.length })
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const { companyId, subscription_status } = await req.json()

  const res = await fetch(`${supabaseUrl}/rest/v1/companies?id=eq.${companyId}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ subscription_status }),
  })

  if (!res.ok) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}
