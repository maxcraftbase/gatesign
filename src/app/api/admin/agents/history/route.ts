import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { getHistory } from '@/lib/agents/db'

export async function GET() {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const runs = await getHistory(ctx.company.id, 20)
    return NextResponse.json({ runs })
  } catch (err) {
    console.error('[history] error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
