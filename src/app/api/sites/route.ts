import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, address, companyId } = await req.json()
  if (!name?.trim() || !companyId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Verify company belongs to this user
  const companyRes = await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${companyId}&user_id=eq.${user.id}&select=id`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  const companies = await companyRes.json()
  if (!companies?.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const res = await fetch(`${SUPABASE_URL}/rest/v1/sites`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      company_id: companyId,
      name: name.trim(),
      address: address?.trim() || null,
    }),
  })

  if (!res.ok) return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
  const data = await res.json()
  return NextResponse.json(data[0])
}
