import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { runAgent } from '@/lib/agents/runner'
import { getHistory } from '@/lib/agents/db'
import type { AgentType } from '@/lib/agents/types'

const VALID: AgentType[] = ['compliance', 'weekly_analysis']

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.SUPERADMIN_PASSWORD?.trim()
  if (!expected) return false
  const token = req.cookies.get('gs-superadmin')?.value
  return token === createHash('sha256').update(expected + 'gs-salt-2025').digest('hex')
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('company_id')
  if (!companyId) return NextResponse.json({ error: 'company_id erforderlich' }, { status: 400 })

  const runs = await getHistory(companyId, 10)
  return NextResponse.json({ runs })
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { type?: string; company_id?: string; company_name?: string }

  if (!body.type || !VALID.includes(body.type as AgentType)) {
    return NextResponse.json({ error: 'Ungültiger Agent-Typ' }, { status: 400 })
  }
  if (!body.company_id || !body.company_name) {
    return NextResponse.json({ error: 'company_id und company_name erforderlich' }, { status: 400 })
  }

  try {
    const data = await runAgent(body.company_id, body.company_name, body.type as AgentType)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
