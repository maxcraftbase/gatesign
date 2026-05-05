import type { ComplianceResult } from './types'
import { getCheckIns, getSettings } from './db'

export async function runCompliance(companyId: string): Promise<{
  result: ComplianceResult
  summary: string
  issuesCount: number
}> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [entries, settings] = await Promise.all([
    getCheckIns(companyId, since),
    getSettings(companyId),
  ])

  const signatureRequired = settings.signature_required === 'true'
  const issues: ComplianceResult['issues'] = []
  const plateMap: Record<string, number> = {}

  for (const e of entries) {
    const driver = String(e.driver_name ?? '—')
    const plate = String(e.license_plate ?? '—')
    const time = String(e.created_at ?? '')

    if (signatureRequired && !e.has_signature) {
      issues.push({ driver, plate, issue: 'Unterschrift fehlt (Pflichtfeld)', time })
    }
    if (!e.briefing_accepted) {
      issues.push({ driver, plate, issue: 'Belehrung nicht akzeptiert', time })
    }
    plateMap[plate] = (plateMap[plate] ?? 0) + 1
  }

  // Flag plates that checked in 3+ times in the same day
  for (const [plate, count] of Object.entries(plateMap)) {
    if (count >= 3) {
      issues.push({ driver: '—', plate, issue: `${count}× am selben Tag eingecheckt`, time: '' })
    }
  }

  const result: ComplianceResult = {
    checked: entries.length,
    period: 'Letzte 24 Stunden',
    signature_required: signatureRequired,
    issues,
  }

  const summary =
    issues.length === 0
      ? `✓ Keine Auffälligkeiten — ${entries.length} Check-ins geprüft`
      : `${issues.length} Auffälligkeit${issues.length !== 1 ? 'en' : ''} bei ${entries.length} Check-ins`

  return { result, summary, issuesCount: issues.length }
}
