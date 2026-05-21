'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, X, Monitor, ExternalLink } from 'lucide-react'
import { PLAN_LIMITS, type PlanName } from '@/lib/subscription'

type VisitorTypeKey = 'truck' | 'visitor' | 'service'

const VISITOR_TYPE_OPTIONS: { key: VisitorTypeKey; label: string; icon: string }[] = [
  { key: 'truck',   label: 'LKW',      icon: '🚛' },
  { key: 'visitor', label: 'Besucher', icon: '🤝' },
  { key: 'service', label: 'Service',  icon: '🔧' },
]

interface Terminal {
  id: string
  name: string
  slug: string
  is_active: boolean
  sort_order: number
  created_at: string
  allowed_visitor_types: string
}

export function TerminalsClient({ slug }: { slug: string }) {
  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [plan, setPlan] = useState<PlanName>('solo')
  const [terminalLimit, setTerminalLimit] = useState<number | null>(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingTypes, setSavingTypes] = useState<string | null>(null)

  async function loadTerminals() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/terminals')
      const data = await res.json()
      setTerminals(data.terminals ?? [])
      setPlan(data.plan ?? 'solo')
      setTerminalLimit(data.terminal_limit !== undefined ? (data.terminal_limit as number | null) : 1)
    } catch { setError('Fehler beim Laden') } finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadTerminals() }, [])

  const activeCount = terminals.filter(t => t.is_active).length
  const limitInfo = PLAN_LIMITS[plan]
  const atLimit = terminalLimit !== null && activeCount >= terminalLimit

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/admin/terminals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'plan_limit_reached') {
          setCreateError(`Ihr Plan erlaubt maximal ${data.limit} Terminal${data.limit !== 1 ? 's' : ''}. Bitte upgraden.`)
        } else {
          setCreateError(data.error ?? 'Fehler beim Erstellen')
        }
        return
      }
      setNewName('')
      void loadTerminals()
    } catch { setCreateError('Netzwerkfehler') } finally { setCreating(false) }
  }

  async function handleToggleActive(terminal: Terminal) {
    await fetch(`/api/admin/terminals/${terminal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !terminal.is_active }),
    })
    void loadTerminals()
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim()) return
    setSaving(true)
    await fetch(`/api/admin/terminals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    })
    setSaving(false)
    setEditingId(null)
    void loadTerminals()
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Terminal "${name}" wirklich löschen? Bestehende Einträge bleiben erhalten.`)) return
    const res = await fetch(`/api/admin/terminals/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { alert(data.error ?? 'Fehler'); return }
    void loadTerminals()
  }

  async function handleToggleType(terminal: Terminal, typeKey: VisitorTypeKey) {
    let current: VisitorTypeKey[] = ['truck', 'visitor', 'service']
    try { current = JSON.parse(terminal.allowed_visitor_types) } catch { /* use default */ }
    const next = current.includes(typeKey)
      ? current.filter(t => t !== typeKey)
      : [...current, typeKey]
    if (next.length === 0) return // enforce minimum 1
    setSavingTypes(terminal.id)
    await fetch(`/api/admin/terminals/${terminal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowed_visitor_types: next }),
    })
    setTerminals(prev => prev.map(t => t.id === terminal.id
      ? { ...t, allowed_visitor_types: JSON.stringify(next) }
      : t
    ))
    setSavingTypes(null)
  }

  const kioskUrl = (termSlug: string) => `${typeof window !== 'undefined' ? window.location.origin : ''}/${slug}/${termSlug}`

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Terminals</h1>
        <p className="text-slate-500 text-sm mt-1">Verwalte die Check-in Terminals deines Unternehmens</p>
      </div>

      {/* Plan info */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-700">Aktueller Plan: <span className="text-slate-900">{limitInfo.label}</span></p>
          <p className="text-xs text-slate-400 mt-0.5">
            {terminalLimit === null
              ? `Unbegrenzte Terminals · ${limitInfo.monthly_price}`
              : `${activeCount} von ${terminalLimit} Terminal${terminalLimit !== 1 ? 's' : ''} aktiv · ${limitInfo.monthly_price}`}
          </p>
        </div>
        {plan !== 'enterprise' && (
          <a href="mailto:info@alpha-consult.one?subject=GateSign Upgrade"
            className="shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
            Upgrade anfragen →
          </a>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}

      {/* Terminal list */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Alle Terminals</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {terminals.length === 0 && (
              <p className="px-6 py-8 text-sm text-slate-400 italic text-center">Noch keine Terminals vorhanden.</p>
            )}
            {terminals.map(terminal => (
              <div key={terminal.id} className="flex flex-col px-6 py-4 gap-3">
                {/* Top row: icon + info + actions */}
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${terminal.is_active ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                    <Monitor className={`w-4 h-4 ${terminal.is_active ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingId === terminal.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') void handleSaveEdit(terminal.id); if (e.key === 'Escape') setEditingId(null) }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-slate-900"
                          autoFocus
                        />
                        <button onClick={() => void handleSaveEdit(terminal.id)} disabled={saving}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-900">{terminal.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-slate-400 font-mono">{terminal.slug}</p>
                          <a href={kioskUrl(terminal.slug)} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5 transition-colors">
                            <ExternalLink className="w-3 h-3" />Kiosk öffnen
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${terminal.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {terminal.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                    {editingId !== terminal.id && (
                      <>
                        <button onClick={() => { setEditingId(terminal.id); setEditName(terminal.name) }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" title="Umbenennen">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => void handleToggleActive(terminal)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title={terminal.is_active ? 'Deaktivieren' : 'Aktivieren'}>
                          {terminal.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button onClick={() => void handleDelete(terminal.id, terminal.name)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="Löschen">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {/* Visitor type chips */}
                {(() => {
                  let active: VisitorTypeKey[] = ['truck', 'visitor', 'service']
                  try { active = JSON.parse(terminal.allowed_visitor_types) } catch { /* use default */ }
                  return (
                    <div className="flex items-center gap-2 pl-13">
                      <span className="text-xs text-slate-400 mr-1">Typen:</span>
                      {VISITOR_TYPE_OPTIONS.map(({ key, label, icon }) => {
                        const isOn = active.includes(key)
                        const isLast = isOn && active.length === 1
                        return (
                          <button
                            key={key}
                            disabled={savingTypes === terminal.id || isLast}
                            onClick={() => void handleToggleType(terminal, key)}
                            title={isLast ? 'Mindestens ein Typ muss aktiv sein' : undefined}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              isOn
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            } disabled:opacity-50`}
                          >
                            {icon} {label}
                          </button>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add terminal */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Terminal hinzufügen</h2>
        {createError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 mb-4 text-sm">{createError}</div>}
        {atLimit ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Terminal-Limit erreicht ({activeCount}/{terminalLimit})</p>
            <p className="mt-1 text-amber-700">
              Ihr <strong>{limitInfo.label}</strong>-Plan erlaubt maximal {terminalLimit} Terminal{terminalLimit !== 1 ? 's' : ''}.
              Für mehr Terminals: <a href="mailto:info@alpha-consult.one?subject=GateSign Upgrade"
                className="underline hover:text-amber-900">Upgrade anfragen</a>
            </p>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="z.B. Eingang Nord, Tor 2, Hauptgebäude…"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
            />
            <button type="submit" disabled={creating || !newName.trim()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors">
              <Plus className="w-4 h-4" />
              {creating ? 'Wird erstellt…' : 'Hinzufügen'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
