'use client'

import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

interface AuditEntry {
  id: string
  user_email: string
  action: string
  action_label: string
  details: Record<string, unknown> | null
  created_at: string
}

const ACTION_ICONS: Record<string, string> = {
  settings_saved: '⚙️',
  note_saved: '📝',
  entry_printed: '🖨️',
  user_invited: '👤',
  user_role_changed: '🔑',
  user_removed: '🗑️',
}

function formatDate(iso: string) {
  try { return new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso)) } catch { return iso }
}

function detailText(action: string, details: Record<string, unknown> | null): string {
  if (!details) return ''
  if (action === 'user_invited') return `→ ${details.invited_email} als ${details.role === 'admin' ? 'Admin' : 'Mitarbeiter'}`
  if (action === 'user_role_changed') return `→ ${details.target_email}: ${details.new_role === 'admin' ? 'Admin' : 'Mitarbeiter'}`
  if (action === 'user_removed') return `→ ${details.removed_email}`
  if (action === 'note_saved') return `Eintrag ${String(details.entry_id).slice(0, 8)}…`
  if (action === 'entry_printed') return `Eintrag ${String(details.entry_id).slice(0, 8)}…`
  return ''
}

export function AuditClient() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/audit-log?limit=100')
      const data = await res.json()
      setEntries(data.entries ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Aktivitätsprotokoll</h1>
          <p className="text-slate-500 text-sm mt-1">Alle Aktionen der letzten 100 Einträge</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Aktualisieren
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Noch keine Aktivitäten.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-start gap-4 px-6 py-4">
                <span className="text-xl mt-0.5 shrink-0">{ACTION_ICONS[entry.action] ?? '•'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{entry.action_label}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {entry.user_email}
                    {detailText(entry.action, entry.details) ? ` · ${detailText(entry.action, entry.details)}` : ''}
                  </p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">{formatDate(entry.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
