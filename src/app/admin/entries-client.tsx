'use client'

import { useState, useEffect, useCallback } from 'react'
import { Download, RefreshCw } from 'lucide-react'

interface Entry {
  id: string
  created_at: string
  driver_name: string
  company_name: string
  license_plate: string
  phone: string | null
  language: string
  briefing_accepted: boolean
  briefing_accepted_at: string | null
  has_signature: boolean
  reference_number: string | null
  visitor_type: string | null
}

const VISITOR_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  truck:   { label: 'LKW',       color: 'bg-amber-50 text-amber-700' },
  visitor: { label: 'Besucher',  color: 'bg-blue-50 text-blue-700' },
  service: { label: 'Dienst',    color: 'bg-violet-50 text-violet-700' },
}

const LANG_FLAGS: Record<string, string> = {
  de: '🇩🇪', en: '🇬🇧', pl: '🇵🇱', ro: '🇷🇴', cs: '🇨🇿',
  hu: '🇭🇺', bg: '🇧🇬', uk: '🇺🇦', ru: '🇷🇺', tr: '🇹🇷',
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function AdminEntriesClient() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadEntries = useCallback((p: number) => {
    setLoading(true)
    setError('')
    fetch(`/api/admin/entries?page=${p}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed')
        return res.json()
      })
      .then(data => {
        setEntries(data.entries ?? [])
        setTotal(data.total ?? 0)
        setPage(p)
      })
      .catch(() => setError('Fehler beim Laden der Einträge.'))
      .finally(() => setLoading(false))
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadEntries(1) }, [loadEntries])

  function handleExport() {
    window.open('/api/admin/export', '_blank')
  }

  const totalPages = Math.max(1, Math.ceil(total / 50))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Check-in Einträge</h1>
          <p className="text-slate-500 text-sm mt-1">{total} Einträge gesamt</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => loadEntries(page)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Aktualisieren
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV Export
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-slate-400 text-lg">Noch keine Check-ins.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left font-medium">Zeit</th>
                    <th className="px-4 py-3 text-left font-medium">Typ</th>
                    <th className="px-4 py-3 text-left font-medium">Fahrer</th>
                    <th className="px-4 py-3 text-left font-medium">Firma</th>
                    <th className="px-4 py-3 text-left font-medium">Kennzeichen</th>
                    <th className="px-4 py-3 text-left font-medium">Telefon</th>
                    <th className="px-4 py-3 text-left font-medium">Sprache</th>
                    <th className="px-4 py-3 text-left font-medium">Belehrung</th>
                    <th className="px-4 py-3 text-left font-medium">Unterschrift</th>
                    <th className="px-4 py-3 text-left font-medium">Referenz</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => (
                    <tr
                      key={entry.id}
                      className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}
                    >
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {entry.visitor_type && VISITOR_TYPE_LABELS[entry.visitor_type] ? (
                          <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${VISITOR_TYPE_LABELS[entry.visitor_type].color}`}>
                            {VISITOR_TYPE_LABELS[entry.visitor_type].label}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                        {entry.driver_name}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {entry.company_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                          {entry.license_plate}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {entry.phone ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-lg" title={entry.language}>
                          {LANG_FLAGS[entry.language] ?? entry.language}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {entry.briefing_accepted ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
                            ✓ Akzeptiert
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {entry.has_signature ? (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                            ✓ Ja
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                        {entry.reference_number ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => loadEntries(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Zurück
              </button>
              <span className="text-sm text-slate-500">
                Seite {page} von {totalPages}
              </span>
              <button
                onClick={() => loadEntries(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Weiter →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
