import type { WeeklyResult } from './types'
import { getCheckIns } from './db'

const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

export async function runWeeklyAnalysis(companyId: string): Promise<{
  result: WeeklyResult
  summary: string
  issuesCount: number
}> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const entries = await getCheckIns(companyId, since)

  const empty: WeeklyResult = {
    checked: 0,
    period: 'Letzte 7 Tage',
    per_day_avg: 0,
    by_type: {},
    peak_hour: '—',
    by_day: {},
    top_companies: [],
    signature_rate: 0,
  }

  if (entries.length === 0) {
    return { result: empty, summary: 'Keine Check-ins in den letzten 7 Tagen.', issuesCount: 0 }
  }

  const byType: Record<string, number> = {}
  const byHour: Record<number, number> = {}
  const byDay: Record<string, number> = {}
  const companyMap: Record<string, number> = {}

  for (const e of entries) {
    const type = String(e.visitor_type ?? 'unbekannt')
    byType[type] = (byType[type] ?? 0) + 1

    const d = new Date(String(e.created_at))
    const h = d.getHours()
    byHour[h] = (byHour[h] ?? 0) + 1
    const day = DAY_NAMES[d.getDay()]
    byDay[day] = (byDay[day] ?? 0) + 1

    const company = String(e.company_name ?? '—')
    companyMap[company] = (companyMap[company] ?? 0) + 1
  }

  const peakEntry = Object.entries(byHour).sort(([, a], [, b]) => b - a)[0]
  const topCompanies = Object.entries(companyMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  const signed = entries.filter(e => e.has_signature).length
  const signatureRate = Math.round((signed / entries.length) * 100)
  const perDay = Math.round(entries.length / 7)
  const peakHour = peakEntry ? `${peakEntry[0]}:00 Uhr (${peakEntry[1]}×)` : '—'

  const result: WeeklyResult = {
    checked: entries.length,
    period: 'Letzte 7 Tage',
    per_day_avg: perDay,
    by_type: byType,
    peak_hour: peakHour,
    by_day: byDay,
    top_companies: topCompanies,
    signature_rate: signatureRate,
  }

  const summary = `${entries.length} Check-ins · Ø ${perDay}/Tag · Peak: ${peakHour} · ${signatureRate}% unterschrieben`
  return { result, summary, issuesCount: 0 }
}
