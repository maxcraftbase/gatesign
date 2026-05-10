'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, LogOut, Users } from 'lucide-react'
import { VISITOR_TYPE_LABELS, LANG_FLAGS, formatDate } from '@/types/entry'

interface InBuildingEntry {
  id: string
  created_at: string
  driver_name: string
  company_name: string
  license_plate: string
  language: string
  visitor_type: string | null
  reference_number: string | null
  contact_person: string | null
}

export function InBuildingClient() {
  const [entries, setEntries] = useState<InBuildingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    fetch('/api/admin/in-building')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        setEntries(d.entries ?? [])
      })
      .catch(() => setError('Fehler beim Laden.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [load])

  async function checkout(id: string) {
    setCheckingOut(id)
    try {
      const res = await fetch(`/api/admin/entries/${id}/checkout`, { method: 'PATCH' })
      if (res.ok) setEntries(prev => prev.filter(e => e.id !== id))
    } catch {
      // silently fail, next refresh will correct state
    } finally {
      setCheckingOut(null)
    }
  }

  const minutesInBuilding = (createdAt: string) => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000)
    if (diff < 60) return `${diff} Min.`
    const h = Math.floor(diff / 60)
    const m = diff % 60
    return `${h} Std. ${m > 0 ? `${m} Min.` : ''}`.trim()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Wer ist im Haus?</h1>
            <p className="text-sm text-slate-400">
              {loading ? 'Lädt …' : `${entries.length} ${entries.length === 1 ? 'Person' : 'Personen'} aktuell auf dem Gelände`}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 text-sm border border-slate-200 text-slate-500 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && entries.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">Aktuell niemand auf dem Gelände</p>
          <p className="text-slate-400 text-sm mt-1">Alle heutigen Check-ins wurden bereits abgemeldet.</p>
        </div>
      )}

      {/* Table */}
      {entries.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Fahrer / Besucher</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Firma</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Kennzeichen</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Typ</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Eingecheckt</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Dauer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Kontakt</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => {
                const typeInfo = entry.visitor_type ? VISITOR_TYPE_LABELS[entry.visitor_type] : null
                const flag = LANG_FLAGS[entry.language] ?? ''
                return (
                  <tr key={entry.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{flag}</span>
                        <span className="font-medium text-slate-900">{entry.driver_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{entry.company_name}</td>
                    <td className="px-5 py-4">
                      <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">
                        {entry.license_plate}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {typeInfo && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-sm whitespace-nowrap">
                      {formatDate(entry.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {minutesInBuilding(entry.created_at)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-sm">
                      {entry.contact_person ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => checkout(entry.id)}
                        disabled={checkingOut === entry.id}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {checkingOut === entry.id ? 'Lädt …' : 'Abmelden'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400 text-center mt-5">
        Automatische Aktualisierung alle 30 Sekunden · Nur heutige Einträge ohne Abmeldung
      </p>
    </div>
  )
}
