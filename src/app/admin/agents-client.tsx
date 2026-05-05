'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import type { AgentRun, AgentType, ComplianceResult, WeeklyResult } from '@/lib/agents/types'

// ─── Agent definitions ────────────────────────────────────────────────────────
const AGENTS: {
  type: AgentType
  name: string
  description: string
  schedule: string
  what: string[]
  emailWhen: string
}[] = [
  {
    type: 'compliance',
    name: 'Compliance-Wächter',
    description: 'Analysiert alle Check-ins der letzten 24 Stunden auf Regelverstöße und Auffälligkeiten.',
    schedule: 'Täglich — 08:00 Uhr',
    what: [
      'Fehlende Unterschriften (wenn als Pflichtfeld konfiguriert)',
      'Nicht akzeptierte Sicherheitsbelehrungen',
      'Kennzeichen die 3× oder öfter am gleichen Tag eingecheckt haben',
    ],
    emailWhen: 'E-Mail bei Auffälligkeiten',
  },
  {
    type: 'weekly_analysis',
    name: 'Wochen-Analyse',
    description: 'Fasst die Check-in-Aktivität der letzten 7 Tage zusammen und liefert Nutzungsstatistiken.',
    schedule: 'Wöchentlich — Montag 09:00 Uhr',
    what: [
      'Gesamtzahl und täglicher Durchschnitt',
      'Verteilung nach Besuchertyp (LKW / Besucher / Service)',
      'Peak-Zeiten und aktivste Wochentage',
      'Top 5 häufigste Firmen',
      'Unterschriften-Quote',
    ],
    emailWhen: 'E-Mail immer (Wochenzusammenfassung)',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
  } catch { return iso }
}

function StatusBadge({ status }: { status: AgentRun['status'] }) {
  if (status === 'success') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
      <CheckCircle className="w-3 h-3" /> Erfolgreich
    </span>
  )
  if (status === 'failed') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" /> Fehler
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> Läuft…
    </span>
  )
}

// ─── Result detail views ──────────────────────────────────────────────────────
function ComplianceDetail({ result }: { result: ComplianceResult }) {
  if (result.issues.length === 0) {
    return <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-4 py-3">Keine Auffälligkeiten gefunden.</p>
  }
  return (
    <div className="flex flex-col gap-1.5">
      {result.issues.map((issue, i) => (
        <div key={i} className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 text-sm">
          <span className="font-mono text-slate-600 shrink-0 mt-0.5">{issue.plate}</span>
          <span className="flex-1 text-slate-700">{issue.driver !== '—' ? `${issue.driver} — ` : ''}{issue.issue}</span>
          {issue.time && <span className="text-xs text-slate-400 shrink-0">{formatDate(issue.time)}</span>}
        </div>
      ))}
    </div>
  )
}

function WeeklyDetail({ result }: { result: WeeklyResult }) {
  const typeLabels: Record<string, string> = { truck: 'LKW', visitor: 'Besucher', service: 'Service' }
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Besuchertypen</p>
        {Object.entries(result.by_type).map(([type, count]) => (
          <div key={type} className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-600">{typeLabels[type] ?? type}</span>
            <span className="font-semibold text-slate-900">{count}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Top Firmen</p>
        {result.top_companies.slice(0, 5).map((c, i) => (
          <div key={i} className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-600 truncate max-w-[140px]">{c.name}</span>
            <span className="font-semibold text-slate-900 shrink-0 ml-2">{c.count}×</span>
          </div>
        ))}
      </div>
      <div className="col-span-2 bg-blue-50 rounded-lg px-4 py-2.5 flex items-center gap-6 text-sm flex-wrap">
        <span className="text-blue-700">Peak: <strong>{result.peak_hour}</strong></span>
        <span className="text-slate-600">Ø <strong>{result.per_day_avg}</strong>/Tag</span>
        <span className="text-slate-600">Unterschriften: <strong>{result.signature_rate}%</strong></span>
      </div>
    </div>
  )
}

function RunDetail({ run }: { run: AgentRun }) {
  if (!run.result) return null
  if (run.agent_type === 'compliance') return <ComplianceDetail result={run.result as ComplianceResult} />
  return <WeeklyDetail result={run.result as WeeklyResult} />
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AgentsClient() {
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [running, setRunning] = useState<AgentType | null>(null)
  const [expandedRun, setExpandedRun] = useState<string | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [flashRun, setFlashRun] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    const res = await fetch('/api/admin/agents/history')
    if (res.ok) {
      const data = await res.json() as { runs: AgentRun[] }
      setRuns(data.runs ?? [])
    }
    setLoadingHistory(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadHistory() }, [loadHistory])

  async function triggerAgent(type: AgentType) {
    setRunning(type)
    try {
      const res = await fetch('/api/admin/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await res.json() as { runId?: string }
      await loadHistory()
      if (data.runId) {
        setFlashRun(data.runId)
        setExpandedRun(data.runId)
        setTimeout(() => setFlashRun(null), 2000)
      }
    } finally {
      setRunning(null)
    }
  }

  const lastRunByType = (type: AgentType) => runs.find(r => r.agent_type === type)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Agenten</h1>
        <p className="text-slate-500 text-sm mt-1">
          Automatisierte Analyse- und Überwachungsprozesse — laufen planmäßig und senden Berichte per E-Mail.
        </p>
      </div>

      {/* Agent cards */}
      <div className="flex flex-col gap-4 mb-10">
        {AGENTS.map(agent => {
          const last = lastRunByType(agent.type)
          const isRunning = running === agent.type
          return (
            <div key={agent.type} className="bg-white border border-slate-100 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-1">
                    <h2 className="text-lg font-bold text-slate-900">{agent.name}</h2>
                    {last && <StatusBadge status={last.status} />}
                  </div>
                  <p className="text-slate-500 text-sm mb-3">{agent.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>🕐 {agent.schedule}</span>
                    <span>📧 {agent.emailWhen}</span>
                    {last && <span>Zuletzt: {formatDate(last.run_at)}</span>}
                  </div>
                </div>
                <button
                  onClick={() => void triggerAgent(agent.type)}
                  disabled={isRunning || running !== null}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  {isRunning
                    ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Läuft…</>
                    : <><Play className="w-3.5 h-3.5" /> Jetzt ausführen</>
                  }
                </button>
              </div>

              {/* What the agent checks */}
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Was wird analysiert</p>
                <ul className="flex flex-col gap-1">
                  {agent.what.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-slate-300 mt-0.5 shrink-0">–</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Last result inline */}
              {last?.summary && (
                <div className={`mt-3 px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                  last.status === 'failed' ? 'bg-red-50 border-red-100 text-red-700' :
                  last.issues_count > 0 ? 'bg-amber-50 border-amber-100 text-amber-800' :
                  'bg-emerald-50 border-emerald-100 text-emerald-700'
                }`}>
                  {last.summary}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Run history */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Ausführungsverlauf</h2>
          <button onClick={() => void loadHistory()}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Aktualisieren
          </button>
        </div>

        {loadingHistory ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : runs.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center">
            <p className="text-slate-400">Noch keine Ausführungen. Starte einen Agenten oben.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {runs.map(run => {
              const agentDef = AGENTS.find(a => a.type === run.agent_type)
              const isExpanded = expandedRun === run.id
              const isFlash = flashRun === run.id
              return (
                <div key={run.id}
                  className={`bg-white border rounded-xl overflow-hidden transition-all ${
                    isFlash ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-100'
                  }`}>
                  <button
                    onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <StatusBadge status={run.status} />
                    <span className="text-sm font-medium text-slate-700 flex-1 min-w-0 truncate">
                      {agentDef?.name ?? run.agent_type}
                    </span>
                    <span className="text-xs text-slate-400 shrink-0">{formatDate(run.run_at)}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 px-4 py-4">
                      {run.summary && (
                        <p className="text-sm text-slate-600 mb-3">{run.summary}</p>
                      )}
                      <RunDetail run={run} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Infrastructure note */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Automatischer Zeitplan (Railway Cron)</p>
        <p className="text-sm text-slate-600 mb-3">
          Für automatische Ausführungen auf Railway ein Cron-Service anlegen mit folgendem Befehl:
        </p>
        <pre className="bg-slate-900 text-slate-100 rounded-lg px-4 py-3 text-xs overflow-x-auto leading-relaxed">
{`curl -X POST https://www.gatesign.de/api/cron/agents \\
  -H "Content-Type: application/json" \\
  -H "x-cron-secret: $CRON_SECRET" \\
  -d '{"type":"compliance","company_id":"...","company_name":"..."}'`}
        </pre>
        <p className="text-xs text-slate-400 mt-2">
          Umgebungsvariable <code className="bg-slate-200 px-1 py-0.5 rounded">CRON_SECRET</code> in Railway setzen — gleicher Wert wie im Hauptservice.
        </p>
      </div>
    </div>
  )
}
