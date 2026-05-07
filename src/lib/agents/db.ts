import type { AgentRun, AgentType, RunStatus } from './types'

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY!
const headers = () => ({
  apikey: key(),
  Authorization: `Bearer ${key()}`,
  'Content-Type': 'application/json',
})

export async function createRun(companyId: string, agentType: AgentType): Promise<string> {
  const res = await fetch(`${url()}/rest/v1/agent_runs`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=representation' },
    body: JSON.stringify({ company_id: companyId, agent_type: agentType, status: 'running' }),
  })
  const [row] = await res.json() as { id: string }[]
  return row.id
}

export async function updateRun(
  id: string,
  status: RunStatus,
  result: unknown,
  summary: string,
  issuesCount: number,
) {
  await fetch(`${url()}/rest/v1/agent_runs?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers(), Prefer: 'return=minimal' },
    body: JSON.stringify({ status, result, summary, issues_count: issuesCount }),
  })
}

export async function getHistory(companyId: string, limit = 20): Promise<AgentRun[]> {
  const params = new URLSearchParams({
    company_id: `eq.${companyId}`,
    order: 'run_at.desc',
    limit: String(limit),
  })
  const res = await fetch(`${url()}/rest/v1/agent_runs?${params}`, {
    headers: headers(),
    cache: 'no-store',
  })
  return res.ok ? (await res.json() as AgentRun[]) : []
}

export async function getCompanyEmail(companyId: string): Promise<string | null> {
  const params = new URLSearchParams({ id: `eq.${companyId}`, select: 'email' })
  const res = await fetch(`${url()}/rest/v1/companies?${params}`, {
    headers: headers(),
    cache: 'no-store',
  })
  const rows = await res.json() as { email: string }[]
  return rows[0]?.email ?? null
}

export async function getSettings(companyId: string): Promise<Record<string, string>> {
  const params = new URLSearchParams({ company_id: `eq.${companyId}`, select: 'key,value' })
  const res = await fetch(`${url()}/rest/v1/app_settings?${params}`, {
    headers: headers(),
    cache: 'no-store',
  })
  if (!res.ok) return {}
  const rows = await res.json() as { key: string; value: string }[]
  return Object.fromEntries(rows.map(r => [r.key, r.value]))
}

export interface CheckIn {
  id: string
  created_at: string
  driver_name: string
  company_name: string
  license_plate: string
  visitor_type: string | null
  briefing_accepted: boolean
  has_signature: boolean
}

export async function getCheckIns(companyId: string, since: string): Promise<CheckIn[]> {
  const params = new URLSearchParams({
    company_id: `eq.${companyId}`,
    created_at: `gte.${encodeURIComponent(since)}`,
    select: 'id,created_at,driver_name,company_name,license_plate,visitor_type,briefing_accepted,has_signature',
    order: 'created_at.asc',
    limit: '2000',
  })
  const res = await fetch(`${url()}/rest/v1/check_ins?${params}`, {
    headers: headers(),
    cache: 'no-store',
  })
  return res.ok ? (await res.json() as CheckIn[]) : []
}
