import { NextRequest, NextResponse } from 'next/server'
import { runAgent } from '@/lib/agents/runner'
import type { AgentType } from '@/lib/agents/types'

const VALID: AgentType[] = ['compliance', 'weekly_analysis']

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json() as { type?: string; company_id?: string; company_name?: string }

    if (!body.type || !VALID.includes(body.type as AgentType)) {
      return NextResponse.json({ error: 'Ungültiger Agent-Typ' }, { status: 400 })
    }
    if (!body.company_id || !body.company_name) {
      return NextResponse.json({ error: 'company_id und company_name erforderlich' }, { status: 400 })
    }

    const data = await runAgent(body.company_id, body.company_name, body.type as AgentType)
    return NextResponse.json(data)
  } catch (err) {
    console.error('[agents] error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
