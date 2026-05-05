import type { AgentType, ComplianceResult, WeeklyResult } from './types'
import { createRun, updateRun, getCompanyEmail } from './db'
import { runCompliance } from './compliance'
import { runWeeklyAnalysis } from './weekly'
import { complianceEmailHtml, weeklyEmailHtml } from './email'
import { sendEmail } from '@/lib/brevo'

export async function runAgent(
  companyId: string,
  companyName: string,
  agentType: AgentType,
): Promise<{ runId: string; summary: string; issuesCount: number }> {
  const runId = await createRun(companyId, agentType)

  try {
    const { result, summary, issuesCount } =
      agentType === 'compliance'
        ? await runCompliance(companyId)
        : await runWeeklyAnalysis(companyId)

    await updateRun(runId, 'success', result, summary, issuesCount)

    // Email delivery is fire-and-forget — a mail failure must not fail the agent run
    void sendAgentEmail(agentType, companyId, companyName, result, issuesCount)

    return { runId, summary, issuesCount }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await updateRun(runId, 'failed', null, `Fehler: ${msg}`, 0)
    throw err
  }
}

async function sendAgentEmail(
  agentType: AgentType,
  companyId: string,
  companyName: string,
  result: unknown,
  issuesCount: number,
) {
  try {
    const email = await getCompanyEmail(companyId)
    if (!email) return

    if (agentType === 'compliance' && issuesCount > 0) {
      await sendEmail({
        to: email,
        subject: `GateSign: ${issuesCount} Compliance-Auffälligkeit${issuesCount !== 1 ? 'en' : ''} — ${companyName}`,
        html: complianceEmailHtml(companyName, result as ComplianceResult),
      })
    } else if (agentType === 'weekly_analysis') {
      await sendEmail({
        to: email,
        subject: `GateSign Wochenreport — ${companyName}`,
        html: weeklyEmailHtml(companyName, result as WeeklyResult),
      })
    }
  } catch {
    // Email failure is logged but never propagated
  }
}
