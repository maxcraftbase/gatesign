'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Mail, AlertTriangle, X, Monitor } from 'lucide-react'
import type { AgentRun, AgentType, ComplianceResult, WeeklyResult } from '@/lib/agents/types'

type Company = {
  id: string
  name: string
  slug: string
  email: string
  subscription_status: string
  trial_ends_at: string | null
  created_at: string
  plan: string
  terminal_limit: number | null
  total_check_ins: number
  check_ins_7d: number
  last_check_in: string | null
  active_terminal_count: number
  daily_7d: number[]
}

type CompanyDetail = {
  checkins_today: number
  checkins_7d: number
  checkins_30d: number
  daily_trend: { date: string; count: number }[]
  by_type: { truck: number; visitor: number; service: number }
  terminals: { id: string; name: string; is_active: boolean }[]
  recent_checkins: {
    id: string
    created_at: string
    visitor_type: string
    driver_name: string | null
    license_plate: string | null
  }[]
}

const PLANS = [
  { value: 'starter',      label: 'Starter',      limit: '1 Terminal' },
  { value: 'professional', label: 'Professional',  limit: '3 Terminals' },
  { value: 'enterprise',   label: 'Enterprise',    limit: '∞ Terminals' },
] as const
type PlanValue = typeof PLANS[number]['value']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  const diff = daysSince(iso)!
  if (diff === 0) return 'heute'
  if (diff === 1) return 'gestern'
  if (diff < 7) return `vor ${diff} T.`
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

function activityColor(c: Company): string {
  if (c.total_check_ins === 0) return 'bg-zinc-600'
  const d = daysSince(c.last_check_in)
  if (d === null || d > 14) return 'bg-red-500'
  if (d > 7) return 'bg-amber-400'
  return 'bg-emerald-500'
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') return <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Aktiv</span>
  if (status === 'trial') return <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-950 text-amber-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Testphase</span>
  return <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-500"><span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />Inaktiv</span>
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  const W = 56
  const H = 18
  const barW = 5
  const gap = 3
  return (
    <svg width={W} height={H} className="inline-block align-middle ml-1.5" aria-hidden>
      {data.map((v, i) => {
        const barH = v > 0 ? Math.max((v / max) * H, 2) : 1
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={H - barH}
            width={barW}
            height={barH}
            rx={1}
            className={v > 0 ? 'fill-blue-400/80' : 'fill-zinc-700'}
          />
        )
      })}
    </svg>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SuperadminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [companies, setCompanies] = useState<Company[]>([])
  const [totalCheckIns, setTotalCheckIns] = useState(0)
  const [checkInsToday, setCheckInsToday] = useState(0)
  const [newThisWeek, setNewThisWeek] = useState(0)
  const [dataLoading, setDataLoading] = useState(false)

  const [activeTab, setActiveTab] = useState<'companies' | 'agents'>('companies')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'inactive'>('all')

  const [toggling, setToggling] = useState<string | null>(null)
  const [extendingTrial, setExtendingTrial] = useState<string | null>(null)
  const [changingPlan, setChangingPlan] = useState<string | null>(null)

  // Agents
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([])
  const [runningAgent, setRunningAgent] = useState<AgentType | null>(null)
  const [expandedRun, setExpandedRun] = useState<string | null>(null)
  const [agentFlash, setAgentFlash] = useState<string | null>(null)

  // Detail drawer
  const [drawerCompany, setDrawerCompany] = useState<Company | null>(null)
  const [drawerData, setDrawerData] = useState<CompanyDetail | null>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)

  async function loadData() {
    setDataLoading(true)
    const res = await fetch('/api/superadmin/data')
    if (res.status === 401) { setAuthed(false); setDataLoading(false); return }
    const json = await res.json()
    setCompanies(json.companies ?? [])
    setTotalCheckIns(json.total_check_ins ?? 0)
    setCheckInsToday(json.check_ins_today ?? 0)
    setNewThisWeek(json.new_this_week ?? 0)
    setDataLoading(false)
  }

  async function openDrawer(company: Company) {
    setDrawerCompany(company)
    setDrawerData(null)
    setDrawerLoading(true)
    const res = await fetch(`/api/superadmin/company/${company.id}`)
    if (res.ok) setDrawerData(await res.json())
    setDrawerLoading(false)
  }

  function closeDrawer() {
    setDrawerCompany(null)
    setDrawerData(null)
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
      setLoginError(d.error ?? 'Fehler')
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

  async function toggleStatus(company: Company) {
    setToggling(company.id)
    const next = company.subscription_status === 'active' ? 'inactive' : 'active'
    await fetch('/api/superadmin/data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: company.id, subscription_status: next }),
    })
    setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, subscription_status: next } : c))
    if (drawerCompany?.id === company.id) setDrawerCompany(prev => prev ? { ...prev, subscription_status: next } : null)
    setToggling(null)
  }

  async function changePlan(company: Company, plan: PlanValue) {
    setChangingPlan(company.id)
    await fetch('/api/superadmin/data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: company.id, plan }),
    })
    setCompanies(prev => prev.map(c => c.id === company.id
      ? { ...c, plan, terminal_limit: plan === 'enterprise' ? null : plan === 'professional' ? 3 : 1 }
      : c
    ))
    if (drawerCompany?.id === company.id) setDrawerCompany(prev => prev ? { ...prev, plan } : null)
    setChangingPlan(null)
  }

  async function extendTrial(company: Company, days: number) {
    setExtendingTrial(company.id)
    const base = company.trial_ends_at && new Date(company.trial_ends_at) > new Date()
      ? new Date(company.trial_ends_at)
      : new Date()
    base.setDate(base.getDate() + days)
    const newDate = base.toISOString()
    await fetch('/api/superadmin/data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: company.id, trial_ends_at: newDate, subscription_status: 'trial' }),
    })
    setCompanies(prev => prev.map(c => c.id === company.id
      ? { ...c, trial_ends_at: newDate, subscription_status: 'trial' }
      : c
    ))
    if (drawerCompany?.id === company.id) setDrawerCompany(prev => prev ? { ...prev, trial_ends_at: newDate, subscription_status: 'trial' } : null)
    setExtendingTrial(null)
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

  useEffect(() => {
    fetch('/api/superadmin/data').then(r => {
      if (r.ok) r.json().then(json => {
        setCompanies(json.companies ?? [])
        setTotalCheckIns(json.total_check_ins ?? 0)
        setCheckInsToday(json.check_ins_today ?? 0)
        setNewThisWeek(json.new_this_week ?? 0)
        setAuthed(true)
      })
    })
  }, [])

  // ─── Computed ───────────────────────────────────────────────────────────────

  const trialExpiringSoon = companies.filter(c =>
    c.subscription_status === 'trial' && c.trial_ends_at && daysUntil(c.trial_ends_at) <= 7
  )
  const activeButChurned = companies.filter(c =>
    c.subscription_status === 'active' && (daysSince(c.last_check_in) ?? 999) > 14
  )
  const neverUsed = companies.filter(c =>
    c.total_check_ins === 0 && (daysSince(c.created_at) ?? 0) > 3
  )

  const filtered = companies.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.subscription_status === statusFilter
    return matchSearch && matchStatus
  })

  // ─── Login ──────────────────────────────────────────────────────────────────

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
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-white text-base outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-700"
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

  // ─── Dashboard ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white">GateSign</span>
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-medium">Superadmin</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={loadData} disabled={dataLoading}
              className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors disabled:opacity-50">
              {dataLoading ? 'Lädt…' : '↻ Aktualisieren'}
            </button>
            <button onClick={handleLogout} className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Tabs */}
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

        {/* ── Agents Tab ── */}
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

        {/* ── Companies Tab ── */}
        {activeTab === 'companies' && (
          <div className="flex flex-col gap-6">

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <KpiCard label="Unternehmen" value={companies.length} />
              <KpiCard label="Check-ins heute" value={checkInsToday} highlight="blue" />
              <KpiCard label="Check-ins (7 Tage)" value={companies.reduce((s, c) => s + c.check_ins_7d, 0)} />
              <KpiCard label="Gesamt Check-ins" value={totalCheckIns} />
              <KpiCard label="Neu diese Woche" value={newThisWeek} highlight={newThisWeek > 0 ? 'green' : undefined} />
              <KpiCard label="Trial endet bald" value={trialExpiringSoon.length} highlight={trialExpiringSoon.length > 0 ? 'amber' : undefined} />
            </div>

            {/* Handlungsbedarf */}
            {(trialExpiringSoon.length > 0 || activeButChurned.length > 0 || neverUsed.length > 0) && (
              <div className="bg-amber-950/30 border border-amber-900/50 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-bold text-amber-400">Handlungsbedarf</h2>
                </div>

                {trialExpiringSoon.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Trial läuft ab</p>
                    <div className="flex flex-col gap-1.5">
                      {trialExpiringSoon.map(c => {
                        const d = daysUntil(c.trial_ends_at!)
                        return (
                          <div key={c.id} className="flex items-center justify-between bg-zinc-900 rounded-xl px-4 py-3">
                            <div>
                              <span className="text-white font-medium text-sm">{c.name}</span>
                              <span className={`ml-2 text-xs font-semibold ${d <= 1 ? 'text-red-400' : d <= 3 ? 'text-orange-400' : 'text-amber-400'}`}>
                                {d <= 0 ? 'abgelaufen' : d === 1 ? 'morgen' : `in ${d} Tagen`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => extendTrial(c, 14)} disabled={extendingTrial === c.id}
                                className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-40">
                                +14 Tage
                              </button>
                              <button onClick={() => extendTrial(c, 30)} disabled={extendingTrial === c.id}
                                className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-40">
                                +30 Tage
                              </button>
                              <button onClick={() => toggleStatus(c)} disabled={toggling === c.id}
                                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 hover:bg-emerald-900 transition-colors disabled:opacity-40">
                                Aktivieren
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {activeButChurned.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Aktiv — keine Nutzung seit 14+ Tagen</p>
                    <div className="flex flex-col gap-1.5">
                      {activeButChurned.map(c => (
                        <div key={c.id} className="flex items-center justify-between bg-zinc-900 rounded-xl px-4 py-3">
                          <div>
                            <span className="text-white font-medium text-sm">{c.name}</span>
                            <span className="ml-2 text-xs text-zinc-500">
                              letzter Check-in: {formatDate(c.last_check_in)}
                            </span>
                          </div>
                          <a href={`mailto:${c.email}`}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
                            <Mail className="w-3 h-3" /> Kontaktieren
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {neverUsed.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Registriert — noch kein Check-in</p>
                    <div className="flex flex-col gap-1.5">
                      {neverUsed.map(c => (
                        <div key={c.id} className="flex items-center justify-between bg-zinc-900 rounded-xl px-4 py-3">
                          <div>
                            <span className="text-white font-medium text-sm">{c.name}</span>
                            <span className="ml-2 text-xs text-zinc-500">registriert {formatDate(c.created_at)}</span>
                          </div>
                          <a href={`mailto:${c.email}`}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
                            <Mail className="w-3 h-3" /> Kontaktieren
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Name oder E-Mail suchen…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-sm outline-none focus:border-zinc-600 placeholder:text-zinc-600"
              />
              <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                {(['all', 'active', 'trial', 'inactive'] as const).map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    {s === 'all' ? 'Alle' : s === 'active' ? 'Aktiv' : s === 'trial' ? 'Trial' : 'Inaktiv'}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="font-semibold text-white">
                  Alle Unternehmen
                  {filtered.length !== companies.length && (
                    <span className="ml-2 text-sm font-normal text-zinc-500">{filtered.length} von {companies.length}</span>
                  )}
                </h2>
                <p className="text-xs text-zinc-600">Zeile anklicken für Details</p>
              </div>

              {dataLoading ? (
                <div className="py-16 text-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">Daten werden geladen…</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-zinc-500 text-sm">Keine Einträge gefunden.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-800/50">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Unternehmen</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Registriert</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">7T / Gesamt</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Letzter</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Plan</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c, i) => {
                        const trialDays = c.trial_ends_at ? daysUntil(c.trial_ends_at) : null
                        const isLast = i === filtered.length - 1
                        return (
                          <tr
                            key={c.id}
                            onClick={() => openDrawer(c)}
                            className={`${!isLast ? 'border-b border-zinc-800/60' : ''} hover:bg-zinc-800/40 transition-colors cursor-pointer`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activityColor(c)}`} title="Aktivität letzte 14 Tage" />
                                <div>
                                  <p className="font-semibold text-white">{c.name}</p>
                                  <p className="text-xs text-zinc-500 mt-0.5">{c.email}</p>
                                  {c.active_terminal_count > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 mt-0.5">
                                      <Monitor className="w-2.5 h-2.5" />
                                      {c.active_terminal_count} Terminal{c.active_terminal_count !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-xs text-zinc-500 whitespace-nowrap">{formatDate(c.created_at)}</td>
                            <td className="px-4 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <Sparkline data={c.daily_7d ?? []} />
                                <span className="font-semibold text-white">{c.check_ins_7d}</span>
                                <span className="text-zinc-600 mx-0.5">/</span>
                                <span className="text-zinc-400">{c.total_check_ins}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-xs text-zinc-500 whitespace-nowrap">{formatDate(c.last_check_in)}</td>
                            <td className="px-4 py-4">
                              <StatusBadge status={c.subscription_status} />
                              {c.subscription_status === 'trial' && trialDays !== null && (
                                <p className={`text-xs mt-1 ${trialDays <= 3 ? 'text-red-400 font-semibold' : 'text-zinc-500'}`}>
                                  {trialDays <= 0 ? 'abgelaufen' : `noch ${trialDays}T`}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                              <select
                                value={c.plan ?? 'starter'}
                                disabled={changingPlan === c.id}
                                onChange={e => void changePlan(c, e.target.value as PlanValue)}
                                className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-2 py-1.5 outline-none focus:border-zinc-500 disabled:opacity-50 cursor-pointer"
                              >
                                {PLANS.map(p => (
                                  <option key={p.value} value={p.value}>{p.label} ({p.limit})</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <a href={`mailto:${c.email}`} title="E-Mail schreiben"
                                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                                  <Mail className="w-3.5 h-3.5" />
                                </a>
                                {c.subscription_status === 'trial' && (
                                  <>
                                    <button onClick={() => extendTrial(c, 14)} disabled={extendingTrial === c.id}
                                      className="text-xs px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors disabled:opacity-40">
                                      +14T
                                    </button>
                                    <button onClick={() => extendTrial(c, 30)} disabled={extendingTrial === c.id}
                                      className="text-xs px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors disabled:opacity-40">
                                      +30T
                                    </button>
                                  </>
                                )}
                                <button onClick={() => void openAgents(c)}
                                  className="text-xs text-violet-400 hover:text-violet-300 border border-violet-800 hover:border-violet-600 hover:bg-violet-950 px-2.5 py-1 rounded-lg transition-colors font-medium">
                                  Agenten
                                </button>
                                <button onClick={() => toggleStatus(c)} disabled={toggling === c.id}
                                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40 font-medium ${
                                    c.subscription_status === 'active'
                                      ? 'bg-red-950 text-red-400 hover:bg-red-900'
                                      : 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900'
                                  }`}>
                                  {toggling === c.id ? '…' : c.subscription_status === 'active' ? 'Deakt.' : 'Aktivieren'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Company Detail Drawer */}
      {drawerCompany && (
        <CompanyDrawer
          company={drawerCompany}
          detail={drawerData}
          loading={drawerLoading}
          onClose={closeDrawer}
          onToggleStatus={toggleStatus}
          onExtendTrial={extendTrial}
          onChangePlan={changePlan}
          onOpenAgents={openAgents}
          toggling={toggling}
          extendingTrial={extendingTrial}
          changingPlan={changingPlan}
        />
      )}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, highlight }: { label: string; value: number; highlight?: 'blue' | 'green' | 'amber' | 'red' }) {
  const valueColor = highlight === 'blue' ? 'text-blue-400'
    : highlight === 'green' ? 'text-emerald-400'
    : highlight === 'amber' ? 'text-amber-400'
    : highlight === 'red' ? 'text-red-400'
    : 'text-white'
  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
    </div>
  )
}

// ─── Company Detail Drawer ────────────────────────────────────────────────────

const VISITOR_TYPE_LABELS: Record<string, string> = { truck: 'LKW', visitor: 'Besucher', service: 'Service' }

function CompanyDrawer({
  company, detail, loading, onClose,
  onToggleStatus, onExtendTrial, onChangePlan, onOpenAgents,
  toggling, extendingTrial, changingPlan,
}: {
  company: Company
  detail: CompanyDetail | null
  loading: boolean
  onClose: () => void
  onToggleStatus: (c: Company) => void
  onExtendTrial: (c: Company, days: number) => void
  onChangePlan: (c: Company, plan: PlanValue) => void
  onOpenAgents: (c: Company) => void
  toggling: string | null
  extendingTrial: string | null
  changingPlan: string | null
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const total = detail ? detail.by_type.truck + detail.by_type.visitor + detail.by_type.service : 0
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-lg bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto flex flex-col shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-white text-base truncate">{company.name}</h2>
              <StatusBadge status={company.subscription_status} />
            </div>
            <p className="text-xs text-zinc-500 mt-1 truncate">
              {company.email} · {company.plan.charAt(0).toUpperCase() + company.plan.slice(1)} · seit {formatDate(company.created_at)}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors flex-shrink-0 mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-6 px-6 py-6 flex-1">

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={company.plan ?? 'starter'}
              disabled={changingPlan === company.id}
              onChange={e => onChangePlan(company, e.target.value as PlanValue)}
              className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-zinc-500 disabled:opacity-50 cursor-pointer"
            >
              {PLANS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            {company.subscription_status === 'trial' && (
              <>
                <button onClick={() => onExtendTrial(company, 14)} disabled={extendingTrial === company.id}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-40">
                  +14 Tage Trial
                </button>
                <button onClick={() => onExtendTrial(company, 30)} disabled={extendingTrial === company.id}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-40">
                  +30 Tage Trial
                </button>
              </>
            )}
            <button onClick={() => { onClose(); onOpenAgents(company) }}
              className="text-xs text-violet-400 hover:text-violet-300 border border-violet-800 hover:border-violet-600 hover:bg-violet-950 px-2.5 py-1.5 rounded-lg transition-colors font-medium">
              Agenten
            </button>
            <button onClick={() => onToggleStatus(company)} disabled={toggling === company.id}
              className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 font-medium ${
                company.subscription_status === 'active'
                  ? 'bg-red-950 text-red-400 hover:bg-red-900'
                  : 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900'
              }`}>
              {toggling === company.id ? '…' : company.subscription_status === 'active' ? 'Deaktivieren' : 'Aktivieren'}
            </button>
            <a href={`mailto:${company.email}`} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
              <Mail className="w-3 h-3" /> E-Mail
            </a>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-500 text-sm">Daten werden geladen…</p>
            </div>
          ) : detail ? (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Heute', value: detail.checkins_today, color: 'text-blue-400' },
                  { label: '7 Tage', value: detail.checkins_7d, color: 'text-white' },
                  { label: '30 Tage', value: detail.checkins_30d, color: 'text-white' },
                  { label: 'Gesamt', value: company.total_check_ins, color: 'text-white' },
                ].map(k => (
                  <div key={k.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium mb-1">{k.label}</p>
                    <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Daily trend */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Tagestrend (14 Tage)</h3>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  {detail.daily_trend.map((d, i) => {
                    const max = Math.max(...detail.daily_trend.map(x => x.count), 1)
                    const pctW = (d.count / max) * 100
                    const isToday = i === detail.daily_trend.length - 1
                    return (
                      <div key={d.date} className={`flex items-center gap-3 px-4 py-2 ${i < detail.daily_trend.length - 1 ? 'border-b border-zinc-800/60' : ''}`}>
                        <span className={`text-xs w-10 shrink-0 ${isToday ? 'text-blue-400 font-semibold' : 'text-zinc-500'}`}>{d.date}</span>
                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isToday ? 'bg-blue-400' : 'bg-zinc-500'}`}
                            style={{ width: `${pctW}%` }}
                          />
                        </div>
                        <span className={`text-xs w-6 text-right shrink-0 tabular-nums ${d.count > 0 ? 'text-white' : 'text-zinc-700'}`}>{d.count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Visitor type breakdown */}
              {total > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Besuchertypen (30 Tage)</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(detail.by_type) as [string, number][]).map(([type, count]) => (
                      <div key={type} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium mb-1">{VISITOR_TYPE_LABELS[type] ?? type}</p>
                        <p className="text-lg font-bold text-white">{count}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{pct(count)}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Terminals */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
                  Terminals ({detail.terminals.length})
                </h3>
                {detail.terminals.length === 0 ? (
                  <p className="text-zinc-600 text-sm">Keine Terminals konfiguriert.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {detail.terminals.map(t => (
                      <div key={t.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${t.is_active ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                        <span className="text-sm text-zinc-200 flex-1">{t.name}</span>
                        <span className={`text-xs ${t.is_active ? 'text-emerald-400' : 'text-zinc-600'}`}>
                          {t.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent check-ins */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Letzte Check-ins</h3>
                {detail.recent_checkins.length === 0 ? (
                  <p className="text-zinc-600 text-sm">Keine Check-ins in den letzten 30 Tagen.</p>
                ) : (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-800/50">
                          <th className="text-left px-4 py-2 text-zinc-500 font-medium">Zeitpunkt</th>
                          <th className="text-left px-3 py-2 text-zinc-500 font-medium">Typ</th>
                          <th className="text-left px-3 py-2 text-zinc-500 font-medium">Name</th>
                          <th className="text-left px-3 py-2 text-zinc-500 font-medium">Kennzeichen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.recent_checkins.map((ci, i) => (
                          <tr key={ci.id} className={i < detail.recent_checkins.length - 1 ? 'border-b border-zinc-800/60' : ''}>
                            <td className="px-4 py-2.5 text-zinc-400 whitespace-nowrap">{formatDateTime(ci.created_at)}</td>
                            <td className="px-3 py-2.5 text-zinc-300">{VISITOR_TYPE_LABELS[ci.visitor_type] ?? ci.visitor_type}</td>
                            <td className="px-3 py-2.5 text-zinc-400 max-w-[100px] truncate">{ci.driver_name ?? '—'}</td>
                            <td className="px-3 py-2.5 text-zinc-400 font-mono">{ci.license_plate ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-zinc-600 text-sm">Fehler beim Laden der Daten.</p>
            </div>
          )}
        </div>
      </div>
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

function AgentStatusBadge({ status }: { status: AgentRun['status'] }) {
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
          <button onClick={onBack} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-1">← Übersicht</button>
          <h2 className="text-lg font-bold text-white">{company.name}</h2>
          <p className="text-sm text-zinc-500">{company.email}</p>
        </div>
        <button onClick={onRefresh} className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors">↻ Aktualisieren</button>
      </div>

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
                    {last && <AgentStatusBadge status={last.status} />}
                  </div>
                  <p className="text-xs text-zinc-500">{agent.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600">🕐 {agent.schedule}</span>
                <button onClick={() => onTrigger(agent.type)} disabled={isRunning || runningAgent !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-zinc-900 text-xs font-semibold hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
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
                  <AgentStatusBadge status={run.status} />
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
