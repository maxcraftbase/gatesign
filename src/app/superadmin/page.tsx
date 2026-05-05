'use client'

import { useState, useEffect } from 'react'

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-xs">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">GateSign</h1>
            <p className="text-slate-400 text-sm mt-1">Superadmin</p>
          </div>
          <form onSubmit={handleLogin} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
              />
            </div>
            {loginError && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{loginError}</p>}
            <button type="submit" disabled={loginLoading}
              className="w-full py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50">
              {loginLoading ? 'Prüfen…' : 'Anmelden'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900">GateSign</span>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Superadmin</span>
          </div>
          <button onClick={handleLogout}
            className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
            Abmelden
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Unternehmen</p>
            <p className="text-3xl font-bold text-slate-900">{companies.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Check-ins gesamt</p>
            <p className="text-3xl font-bold text-slate-900">{totalCheckIns}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Aktive Abos</p>
            <p className="text-3xl font-bold text-slate-900">
              {companies.filter(c => c.subscription_status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">In Testphase</p>
            <p className="text-3xl font-bold text-amber-500">
              {companies.filter(c => c.subscription_status === 'trial').length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Alle Unternehmen</h2>
            <button onClick={loadData} disabled={dataLoading}
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50">
              {dataLoading ? 'Lädt…' : '↻ Aktualisieren'}
            </button>
          </div>

          {dataLoading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Daten werden geladen…</div>
          ) : companies.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">Noch keine Unternehmen registriert.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Unternehmen</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Slug</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Check-ins</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Letzter</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Abo</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c, i) => (
                    <tr key={c.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i === companies.length - 1 ? 'border-b-0' : ''}`}>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{c.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <a href={`/${c.slug}/admin`} target="_blank" rel="noopener noreferrer"
                          className="text-slate-500 hover:text-slate-900 font-mono text-xs hover:underline">
                          /{c.slug}
                        </a>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-slate-900">{c.total_check_ins}</span>
                      </td>
                      <td className="px-4 py-4 text-slate-500 text-xs">
                        {formatDate(c.last_check_in)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                          c.subscription_status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : c.subscription_status === 'trial'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            c.subscription_status === 'active' ? 'bg-emerald-500'
                            : c.subscription_status === 'trial' ? 'bg-amber-400'
                            : 'bg-slate-300'
                          }`} />
                          {c.subscription_status === 'active' ? 'Aktiv'
                            : c.subscription_status === 'trial' ? 'Testphase'
                            : 'Inaktiv'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => toggleStatus(c)}
                          disabled={toggling === c.id}
                          className="text-xs text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                        >
                          {toggling === c.id ? '…' : c.subscription_status === 'active' ? 'Deaktivieren' : 'Aktivieren'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
