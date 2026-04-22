import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function postgrest(path: string, options?: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options?.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function POST(req: NextRequest) {
  const {
    driverId, siteId, briefingId, briefingVersion, lang,
    driverName, driverCompany, driverPhone, licensePlate, trailerPlate,
    referenceNumber, confirmBriefing,
  } = await req.json()

  if (!driverId || !siteId || !briefingId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (confirmBriefing) {
    await postgrest('briefing_confirmations', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        driver_id: driverId,
        site_id: siteId,
        briefing_id: briefingId,
        briefing_version: briefingVersion,
        language: lang,
      }),
    })
  }

  await postgrest('check_ins', {
    method: 'POST',
    body: JSON.stringify({
      driver_id: driverId,
      site_id: siteId,
      briefing_id: briefingId,
      briefing_version: briefingVersion,
      driver_name: driverName,
      driver_company: driverCompany,
      driver_phone: driverPhone,
      license_plate: licensePlate,
      trailer_plate: trailerPlate || null,
      reference_number: referenceNumber || null,
      language: lang,
      briefing_confirmed: true,
      briefing_confirmed_at: new Date().toISOString(),
    }),
  })

  return NextResponse.json({ ok: true })
}
