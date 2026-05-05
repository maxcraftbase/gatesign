import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { runAgent } from '@/lib/agents/runner'
import type { AgentType } from '@/lib/agents/types'

const VALID: AgentType[] = ['compliance', 'weekly_analysis']

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { type?: string }
    if (!body.type || !VALID.includes(body.type as AgentType)) {
      return NextResponse.json({ error: 'Ungültiger Agent-Typ' }, { status: 400 })
    }

    const data = await runAgent(ctx.company.id, ctx.company.name, body.type as AgentType)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
