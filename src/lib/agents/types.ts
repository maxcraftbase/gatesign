export type AgentType = 'compliance' | 'weekly_analysis'
export type RunStatus = 'running' | 'success' | 'failed'

export interface AgentRun {
  id: string
  company_id: string
  agent_type: AgentType
  run_at: string
  status: RunStatus
  result: ComplianceResult | WeeklyResult | null
  summary: string
  issues_count: number
}

export interface ComplianceIssue {
  driver: string
  plate: string
  issue: string
  time: string
}

export interface ComplianceResult {
  checked: number
  period: string
  signature_required: boolean
  issues: ComplianceIssue[]
}

export interface WeeklyResult {
  checked: number
  period: string
  per_day_avg: number
  by_type: Record<string, number>
  peak_hour: string
  by_day: Record<string, number>
  top_companies: { name: string; count: number }[]
  signature_rate: number
}
