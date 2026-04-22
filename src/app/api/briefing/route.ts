import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function dbFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options?.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { siteId, texts, existingBriefingId, existingVersion } = await req.json()
  if (!siteId) return NextResponse.json({ error: 'Missing siteId' }, { status: 400 })

  // Verify site belongs to user
  const sites = await dbFetch(
    `sites?id=eq.${siteId}&select=id,companies!inner(user_id)&companies.user_id=eq.${user.id}`
  )
  if (!sites?.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const filled = Object.entries(texts as Record<string, string>).filter(([, v]) => v.trim())
  if (!filled.length) return NextResponse.json({ error: 'No content' }, { status: 400 })

  // Deactivate existing briefing
  if (existingBriefingId) {
    await dbFetch(`safety_briefings?id=eq.${existingBriefingId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: false }),
    })
  }

  const newVersion = (existingVersion ?? 0) + 1

  // Create new briefing
  const [newBriefing] = await dbFetch('safety_briefings', {
    method: 'POST',
    body: JSON.stringify({ site_id: siteId, version: newVersion, is_active: true }),
  })

  // Insert translations
  await dbFetch('briefing_translations', {
    method: 'POST',
    body: JSON.stringify(
      filled.map(([language, content]) => ({ briefing_id: newBriefing.id, language, content }))
    ),
  })

  return NextResponse.json({ id: newBriefing.id, version: newVersion })
}
