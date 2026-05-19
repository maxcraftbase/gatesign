import { NextRequest, NextResponse } from 'next/server'
import { isSuperadminAuthorized } from '@/lib/superadmin-auth'
import { supabaseUrl, serviceKey } from '@/lib/supabase-server'

type RawCheckIn = {
  id: string
  created_at: string
  visitor_type: string
  driver_name: string | null
  license_plate: string | null
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSuperadminAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [checkInsRes, terminalsRes] = await Promise.all([
    fetch(
      `${supabaseUrl}/rest/v1/check_ins?company_id=eq.${id}&select=id,created_at,visitor_type,driver_name,license_plate&created_at=gte.${encodeURIComponent(thirtyDaysAgo)}&order=created_at.desc&limit=1000`,
      { headers, cache: 'no-store' }
    ),
    fetch(
      `${supabaseUrl}/rest/v1/terminals?company_id=eq.${id}&select=id,name,is_active&order=name.asc`,
      { headers, cache: 'no-store' }
    ),
  ])

  if (!checkInsRes.ok || !terminalsRes.ok) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const checkIns: RawCheckIn[] = await checkInsRes.json()
  const terminals: { id: string; name: string; is_active: boolean }[] = await terminalsRes.json()

  const now = Date.now()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()

  const checkins_today = checkIns.filter(ci => ci.created_at >= todayStart.toISOString()).length
  const checkins_7d = checkIns.filter(ci => ci.created_at >= sevenDaysAgo).length
  const checkins_30d = checkIns.length

  const daily_trend = Array.from({ length: 14 }, (_, i) => {
    const dayStart = new Date(now - (13 - i) * 86400000)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart.getTime() + 86400000)
    const count = checkIns.filter(
      ci => ci.created_at >= dayStart.toISOString() && ci.created_at < dayEnd.toISOString()
    ).length
    return {
      date: dayStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      count,
    }
  })

  const by_type = { truck: 0, visitor: 0, service: 0 }
  for (const ci of checkIns) {
    const t = ci.visitor_type as keyof typeof by_type
    if (t in by_type) by_type[t]++
  }

  return NextResponse.json({
    checkins_today,
    checkins_7d,
    checkins_30d,
    daily_trend,
    by_type,
    terminals,
    recent_checkins: checkIns.slice(0, 10),
  })
}
