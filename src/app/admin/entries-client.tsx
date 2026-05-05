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
          <div className="flex flex-col gap-2">
            {/* Header */}
            <div className="grid grid-cols-[140px_80px_1fr_1fr_110px_120px_50px_90px_80px] gap-3 px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Zeit</span>
              <span>Typ</span>
              <span>Fahrer</span>
              <span>Firma</span>
              <span>Kennzeichen</span>
              <span>Telefon</span>
              <span>Spr.</span>
              <span>Belehrung</span>
              <span>Unterschrift</span>
            </div>

            {/* Rows */}
            <div className="flex flex-col gap-1.5">
              {entries.map(entry => (
                <div key={entry.id}
                  className="grid grid-cols-[140px_80px_1fr_1fr_110px_120px_50px_90px_80px] gap-3 items-center bg-white border border-slate-100 rounded-xl px-4 py-3 hover:border-slate-200 hover:shadow-sm transition-all">

                  <span className="text-xs text-slate-500 whitespace-nowrap">{formatDate(entry.created_at)}</span>

                  <span>
                    {entry.visitor_type && VISITOR_TYPE_LABELS[entry.visitor_type] ? (
                      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${VISITOR_TYPE_LABELS[entry.visitor_type].color}`}>
                        {VISITOR_TYPE_LABELS[entry.visitor_type].label}
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </span>

                  <span className="font-semibold text-slate-900 text-sm truncate">{entry.driver_name}</span>

                  <span className="text-slate-600 text-sm truncate">{entry.company_name}</span>

                  <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs w-fit">
                    {entry.license_plate}
                  </span>

                  <span className="text-slate-500 text-xs truncate">{entry.phone ?? '—'}</span>

                  <span className="text-base" title={entry.language}>
                    {LANG_FLAGS[entry.language] ?? entry.language}
                  </span>

                  <span>
                    {entry.briefing_accepted
                      ? <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">✓ Ja</span>
                      : <span className="text-slate-300 text-xs">—</span>}
                  </span>

                  <span>
                    {entry.has_signature
                      ? <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">✓ Ja</span>
                      : <span className="text-slate-300 text-xs">—</span>}
                  </span>
                </div>
              ))}
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
