import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { supabaseUrl, serviceKey } from '@/lib/supabase-server'

// GET: all terminal IDs this user has access to (within the caller's company)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: userId } = await params

  const res = await fetch(
    `${supabaseUrl}/rest/v1/user_terminal_access?user_id=eq.${userId}&company_id=eq.${ctx.company.id}&select=terminal_id`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  const rows: { terminal_id: string }[] = res.ok ? await res.json() : []
  return NextResponse.json({ terminal_ids: rows.map(r => r.terminal_id) })
}
