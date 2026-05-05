'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import type { AgentRun, AgentType, ComplianceResult, WeeklyResult } from '@/lib/agents/types'

type Company = {
  id: string
  name: string
  slug: string
  email: string
  subscription_status: string
  trial_ends_at: string | null
  created_at: string
  total_check_ins: number
  last_check_in: string | null
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'heute'
  if (diff === 1) return 'gestern'
  if (diff < 7) return `vor ${diff} T.`
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function SuperadminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [companies, setCompanies] = useState<Company[]>([])
  const [totalCheckIns, setTotalCheckIns] = useState(0)
  const [dataLoading, setDataLoading] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [impersonating, setImpersonating] = useState<string | null>(null)

  // Agents
  const [activeTab, setActiveTab] = useState<'companies' | 'agents'>('companies')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([])
  const [runningAgent, setRunningAgent] = useState<AgentType | null>(null)
  const [expandedRun, setExpandedRun] = useState<string | null>(null)
  const [agentFlash, setAgentFlash] = useState<string | null>(null)

  async function loadData() {
    setDataLoading(true)
    const res = await fetch('/api/superadmin/data')
    if (res.status === 401) { setAuthed(false); setDataLoading(false); return }
    const json = await res.json()
    setCompanies(json.companies ?? [])
    setTotalCheckIns(json.total_check_ins ?? 0)
    setDataLoading(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    const res = await fetch('/api/superadmin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      const d = await res.json()
      setLoginError((d.error ?? 'Fehler') + (d.debug ? ` (${d.debug})` : ''))
      setLoginLoading(false)
      return
    }
    setLoginLoading(false)
    await loadData()
    setAuthed(true)
  }

  async function handleLogout() {
    await fetch('/api/superadmin/logout', { method: 'POST' })
    setAuthed(false)
    setCompanies([])
  }

  async function handleImpersonate(company: Company) {
    setImpersonating(company.id)
    const newTab = window.open('', '_blank')
    try {
      const res = await fetch('/api/superadmin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companySlug: company.slug }),
      })
      if (res.ok) {
        const data = await res.json() as { adminUrl: string }
        if (newTab) newTab.location.href = window.location.origin + data.adminUrl
      } else {
        newTab?.close()
      }
    } finally {
      setImpersonating(null)
    }
  }

  async function toggleStatus(company: Company) {
    setToggling(company.id)
    // trial → active → inactive → active
    const next = company.subscription_status === 'active' ? 'inactive' : 'active'
    await fetch('/api/superadmin/data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: company.id, subscription_status: next }),
    })
    setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, subscription_status: next } : c))
    setToggling(null)
  }

  const loadAgentHistory = useCallback(async (company: Company) => {
    const res = await fetch(`/api/superadmin/agents?company_id=${company.id}`)
    if (res.ok) {
      const data = await res.json() as { runs: AgentRun[] }
      setAgentRuns(data.runs ?? [])
    }
  }, [])

  async function openAgents(company: Company) {
    setSelectedCompany(company)
    setAgentRuns([])
    setActiveTab('agents')
    await loadAgentHistory(company)
  }

  async function triggerAgent(type: AgentType) {
    if (!selectedCompany) return
    setRunningAgent(type)
    try {
      const res = await fetch('/api/superadmin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, company_id: selectedCompany.id, company_name: selectedCompany.name }),
      })
      const data = await res.json() as { runId?: string }
      await loadAgentHistory(selectedCompany)
      if (data.runId) {
        setAgentFlash(data.runId)
        setExpandedRun(data.runId)
        setTimeout(() => setAgentFlash(null), 2000)
      }
    } finally {
      setRunningAgent(null)
    }
  }

  // Try auto-auth on mount (cookie may still be valid)
  useEffect(() => {
    fetch('/api/superadmin/data').then(r => {
      if (r.ok) {
        r.json().then(json => {
          setCompanies(json.companies ?? [])
          setTotalCheckIns(json.total_check_ins ?? 0)
          setAuthed(true)
        })
      }
    })
  }, [])

  if (!authed) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="w-full max-w-xs">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">GateSign</h1>
            <p className="text-zinc-500 text-sm mt-1">Superadmin</p>
          </div>
          <form onSubmit={handleLogin} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-white text-base outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-700 placeholder:text-zinc-600"
              />
            </div>
            {loginError && <p className="text-sm text-red-400 bg-red-950 border border-red-900 rounded-lg px-3 py-2">{loginError}</p>}
            <button type="submit" disabled={loginLoading}
              className="w-full py-3 bg-white text-zinc-900 font-semibold rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-50">
              {loginLoading ? 'Prüfen…' : 'Anmelden'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white">GateSign</span>
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-medium">Superadmin</span>
          </div>
          <button onClick={handleLogout}
            className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">
            Abmelden
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 bg-zinc-900 p-1 rounded-xl w-fit border border-zinc-800">
          <button onClick={() => setActiveTab('companies')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'companies' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
            Unternehmen
          </button>
          <button onClick={() => setActiveTab('agents')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'agents' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
            Agenten {selectedCompany && <span className="ml-1 text-violet-400">· {selectedCompany.name}</span>}
          </button>
        </div>

        {activeTab === 'agents' && (
          <AgentsPanel
            company={selectedCompany}
            runs={agentRuns}
            runningAgent={runningAgent}
            expandedRun={expandedRun}
            agentFlash={agentFlash}
            onTrigger={triggerAgent}
            onToggleExpand={id => setExpandedRun(expandedRun === id ? null : id)}
            onRefresh={() => selectedCompany ? void loadAgentHistory(selectedCompany) : undefined}
            onBack={() => setActiveTab('companies')}
          />
        )}

        {activeTab === 'companies' && (
        <>{/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-1">Unternehmen</p>
            <p className="text-3xl font-bold text-white">{companies.length}</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-1">Check-ins gesamt</p>
            <p className="text-3xl font-bold text-white">{totalCheckIns}</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-1">Aktive Abos</p>
            <p className="text-3xl font-bold text-white">
              {companies.filter(c => c.subscription_status === 'active').length}
            </p>
          </div>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-1">In Testphase</p>
            <p className="text-3xl font-bold text-amber-400">
              {companies.filter(c => c.subscription_status === 'trial').length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">Alle Unternehmen</h2>
            <button onClick={loadData} disabled={dataLoading}
              className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors disabled:opacity-50">
              {dataLoading ? 'Lädt…' : '↻ Aktualisieren'}
            </button>
          </div>

          {dataLoading ? (
            <div className="py-16 text-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">Daten werden geladen…</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-2xl mb-2">🏢</p>
              <p className="text-zinc-300 font-medium mb-1">Noch keine Unternehmen registriert</p>
              <p className="text-zinc-500 text-sm">Neue Firmen erscheinen hier nach der Registrierung.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-800/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Unternehmen</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Registriert</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Check-ins</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Letzter</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Abo / Testende</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c, i) => (
                    <tr key={c.id} className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors ${i === companies.length - 1 ? 'border-b-0' : ''}`}>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{c.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{c.email}</p>
                      </td>
                      <td className="px-4 py-4 text-xs text-zinc-500">
                        {formatDate(c.created_at)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-white">{c.total_check_ins}</span>
                        {c.total_check_ins === 0 && (
                          <span className="block text-xs text-zinc-600 mt-0.5">noch keiner</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-zinc-500 text-xs">
                        {formatDate(c.last_check_in)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                          c.subscription_status === 'active'
                            ? 'bg-emerald-950 text-emerald-400'
                            : c.subscription_status === 'trial'
                            ? 'bg-amber-950 text-amber-400'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            c.subscription_status === 'active' ? 'bg-emerald-500'
                            : c.subscription_status === 'trial' ? 'bg-amber-400'
                            : 'bg-zinc-600'
                          }`} />
                          {c.subscription_status === 'active' ? 'Aktiv'
                            : c.subscription_status === 'trial' ? 'Testphase'
                            : 'Inaktiv'}
                        </span>
                        {c.subscription_status === 'trial' && c.trial_ends_at && (
                          <p className="text-xs text-zinc-500 mt-1">
                            bis {new Date(c.trial_ends_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => void openAgents(c)}
                            className="text-xs text-violet-400 hover:text-violet-300 border border-violet-800 hover:border-violet-600 hover:bg-violet-950 px-3 py-1.5 rounded-lg transition-colors font-medium"
                          >
                            Agenten
                          </button>
                          <button
                            onClick={() => handleImpersonate(c)}
                            disabled={impersonating === c.id}
                            className="text-xs text-blue-400 hover:text-blue-300 border border-blue-800 hover:border-blue-600 hover:bg-blue-950 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 font-medium"
                          >
                            {impersonating === c.id ? '…' : 'Einloggen ↗'}
                          </button>
                          <button
                            onClick={() => toggleStatus(c)}
                            disabled={toggling === c.id}
                            className={`text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 font-medium ${
                              c.subscription_status === 'active'
                                ? 'bg-red-950 text-red-400 hover:bg-red-900'
                                : 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900'
                            }`}
                          >
                            {toggling === c.id ? '…' : c.subscription_status === 'active' ? 'Deaktivieren' : 'Aktivieren'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>)}
      </main>
    </div>
  )
}

// ─── Agents Panel ─────────────────────────────────────────────────────────────
const AGENT_DEFS: { type: AgentType; name: string; description: string; schedule: string }[] = [
  {
    type: 'compliance',
    name: 'Compliance-Wächter',
    description: 'Prüft fehlende Unterschriften, nicht akzeptierte Belehrungen und doppelte Kennzeichen (letzte 24h).',
    schedule: 'Täglich 08:00',
  },
  {
    type: 'weekly_analysis',
    name: 'Wochen-Analyse',
    description: 'Zusammenfassung der letzten 7 Tage: Check-in Volumen, Typen, Peak-Zeiten, Top-Firmen.',
    schedule: 'Mo 09:00',
  },
]

function StatusBadge({ status }: { status: AgentRun['status'] }) {
  if (status === 'success') return <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" /> OK</span>
  if (status === 'failed') return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Fehler</span>
  return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> Läuft…</span>
}

function RunDetail({ run }: { run: AgentRun }) {
  if (!run.result) return null
  if (run.agent_type === 'compliance') {
    const r = run.result as ComplianceResult
    if (r.issues.length === 0) return <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-4 py-2.5">Keine Auffälligkeiten gefunden.</p>
    return (
      <div className="flex flex-col gap-1.5">
        {r.issues.map((issue, i) => (
          <div key={i} className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm">
            <span className="font-mono text-slate-500 shrink-0">{issue.plate}</span>
            <span className="flex-1 text-slate-700">{issue.driver !== '—' ? `${issue.driver} — ` : ''}{issue.issue}</span>
          </div>
        ))}
      </div>
    )
  }
  const r = run.result as WeeklyResult
  const typeLabels: Record<string, string> = { truck: 'LKW', visitor: 'Besucher', service: 'Service' }
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Typen</p>
        {Object.entries(r.by_type).map(([t, c]) => (
          <div key={t} className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-600">{typeLabels[t] ?? t}</span>
            <span className="font-semibold">{c}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Top Firmen</p>
        {r.top_companies.slice(0, 5).map((c, i) => (
          <div key={i} className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-600 truncate max-w-[130px]">{c.name}</span>
            <span className="font-semibold shrink-0 ml-2">{c.count}×</span>
          </div>
        ))}
      </div>
      <div className="col-span-2 bg-blue-50 rounded-lg px-4 py-2 text-sm flex gap-6 flex-wrap">
        <span className="text-blue-700">Peak: <strong>{r.peak_hour}</strong></span>
        <span className="text-slate-600">Ø <strong>{r.per_day_avg}</strong>/Tag</span>
        <span className="text-slate-600">Unterschriften: <strong>{r.signature_rate}%</strong></span>
      </div>
    </div>
  )
}

function AgentsPanel({
  company, runs, runningAgent, expandedRun, agentFlash,
  onTrigger, onToggleExpand, onRefresh, onBack,
}: {
  company: Company | null
  runs: AgentRun[]
  runningAgent: AgentType | null
  expandedRun: string | null
  agentFlash: string | null
  onTrigger: (type: AgentType) => void
  onToggleExpand: (id: string) => void
  onRefresh: () => void
  onBack: () => void
}) {
  if (!company) return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-12 text-center">
      <p className="text-zinc-500">Wähle ein Unternehmen über den &quot;Agenten&quot;-Button in der Tabelle.</p>
      <button onClick={onBack} className="mt-4 text-sm text-zinc-500 hover:text-zinc-200 transition-colors">← Zurück zur Übersicht</button>
    </div>
  )

  const lastByType = (type: AgentType) => runs.find(r => r.agent_type === type)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">{company.name}</h2>
          <p className="text-sm text-zinc-500">{company.email}</p>
        </div>
        <button onClick={onRefresh} className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors">↻ Aktualisieren</button>
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {AGENT_DEFS.map(agent => {
          const last = lastByType(agent.type)
          const isRunning = runningAgent === agent.type
          return (
            <div key={agent.type} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white text-sm">{agent.name}</h3>
                    {last && <StatusBadge status={last.status} />}
                  </div>
                  <p className="text-xs text-zinc-500">{agent.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600">🕐 {agent.schedule}</span>
                <button
                  onClick={() => onTrigger(agent.type)}
                  disabled={isRunning || runningAgent !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-zinc-900 text-xs font-semibold hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRunning
                    ? <><div className="w-3 h-3 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" /> Läuft…</>
                    : <><Play className="w-3 h-3" /> Ausführen</>}
                </button>
              </div>
              {last?.summary && (
                <div className={`mt-3 px-3 py-2 rounded-lg text-xs ${last.status === 'failed' ? 'bg-red-950 text-red-400' : last.issues_count > 0 ? 'bg-amber-950 text-amber-400' : 'bg-emerald-950 text-emerald-400'}`}>
                  {last.summary}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Run history */}
      <h3 className="text-sm font-bold text-white mb-3">Verlauf</h3>
      {runs.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <p className="text-zinc-500 text-sm">Noch keine Ausführungen — oben starten.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {runs.map(run => {
            const def = AGENT_DEFS.find(a => a.type === run.agent_type)
            const isExpanded = expandedRun === run.id
            return (
              <div key={run.id} className={`bg-zinc-900 border rounded-xl overflow-hidden transition-all ${agentFlash === run.id ? 'border-blue-500 ring-2 ring-blue-900' : 'border-zinc-800'}`}>
                <button onClick={() => onToggleExpand(run.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800/50 transition-colors">
                  <StatusBadge status={run.status} />
                  <span className="text-sm font-medium text-zinc-300 flex-1 truncate">{def?.name ?? run.agent_type}</span>
                  <span className="text-xs text-zinc-600 shrink-0">
                    {new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(run.run_at))}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-600 shrink-0" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-zinc-800 px-4 py-4">
                    {run.summary && <p className="text-sm text-zinc-400 mb-3">{run.summary}</p>}
                    <RunDetail run={run} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
