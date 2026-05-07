'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Download, RefreshCw, FileText, Search } from 'lucide-react'
import { type Entry, VISITOR_TYPE_LABELS, LANG_FLAGS, formatDate } from '@/types/entry'
import { EntryModal } from '@/components/admin/EntryModal'

export function AdminEntriesClient() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [contactPersons, setContactPersons] = useState<string[]>([])
  const [companyPdfUrl, setCompanyPdfUrl] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sort, setSort] = useState<{ col: string; dir: 'asc' | 'desc' }>({ col: 'created_at', dir: 'desc' })

  const loadEntries = useCallback((p: number, q: string, type: string, sortCol: string, sortDir: 'asc' | 'desc') => {
    setLoading(true)
    setError('')
    const qs = new URLSearchParams({ page: String(p), sort: sortCol, dir: sortDir })
    if (q.trim()) qs.set('search', q.trim())
    if (type) qs.set('type', type)
    fetch(`/api/admin/entries?${qs}`)
      .then(res => { if (!res.ok) throw new Error('Failed'); return res.json() })
      .then(data => {
        setEntries(data.entries ?? [])
        setTotal(data.total ?? 0)
        setCompanyName(data.companyName ?? '')
        setLogoUrl(data.logoUrl ?? '')
        if (data.contactPersons) setContactPersons(data.contactPersons)
        setCompanyPdfUrl(data.companyPdfUrl ?? '')
        setPage(p)
      })
      .catch(() => setError('Fehler beim Laden der Einträge.'))
      .finally(() => setLoading(false))
  }, [])

  const searchRef = useRef(search)
  const mountedRef = useRef(false)
  useEffect(() => {
    const isMount = !mountedRef.current
    mountedRef.current = true
    const isSearchChange = !isMount && search !== searchRef.current
    searchRef.current = search
    const t = setTimeout(() => loadEntries(1, search, typeFilter, sort.col, sort.dir), isSearchChange ? 350 : 0)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, sort])

  function toggleSort(col: string) {
    setSort(prev => prev.col === col ? { col, dir: prev.dir === 'desc' ? 'asc' : 'desc' } : { col, dir: 'asc' })
  }

  useEffect(() => {
    let active = true
    if (!selectedEntry?.has_signature || !selectedEntry?.id) {
      Promise.resolve().then(() => { if (active) setSignatureData(null) })
    } else {
      fetch(`/api/admin/entries/${selectedEntry.id}/signature`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (active) setSignatureData(data?.signature_data ?? null) })
        .catch(() => { if (active) setSignatureData(null) })
    }
    return () => { active = false }
  }, [selectedEntry?.id])

  useEffect(() => {
    const id = setInterval(() => {
      const qs = new URLSearchParams({ page: String(page), sort: sort.col, dir: sort.dir })
      if (search.trim()) qs.set('search', search.trim())
      if (typeFilter) qs.set('type', typeFilter)
      fetch(`/api/admin/entries?${qs}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (!data) return
          setEntries(data.entries ?? [])
          setTotal(data.total ?? 0)
        })
        .catch(() => {})
    }, 30_000)
    return () => clearInterval(id)
  }, [search, typeFilter, sort, page])

  function handleNoteUpdated(id: string, note: string, translated: string, assignedContact: string | null) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, staff_note: note, staff_note_translated: translated, assigned_contact: assignedContact } : e))
    if (selectedEntry?.id === id) setSelectedEntry(e => e ? { ...e, staff_note: note, staff_note_translated: translated, assigned_contact: assignedContact } : e)
  }

  const totalPages = Math.max(1, Math.ceil(total / 50))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Check-in Einträge</h1>
          <p className="text-slate-500 text-sm mt-1">{total} Einträge{search ? ' gefunden' : ' gesamt'}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => loadEntries(page, search, typeFilter, sort.col, sort.dir)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Aktualisieren
          </button>
          <button onClick={() => window.open('/api/admin/export', '_blank')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors">
            <Download className="w-4 h-4" />
            CSV Export
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Suche nach Name, Referenz oder Firma…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 bg-white"
          />
        </div>
        <div className="flex gap-1.5">
          {([['', 'Alle'], ['truck', 'LKW'], ['visitor', 'Besucher'], ['service', 'Dienst']] as [string, string][]).map(([val, label]) => (
            <button key={val} onClick={() => setTypeFilter(val)}
              className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap ${typeFilter === val ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}

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
            <div className="grid grid-cols-[100px_140px_80px_1fr_1fr_110px_50px_70px_30px] gap-3 px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Referenz</span>
              <button onClick={() => toggleSort('created_at')} className="flex items-center gap-0.5 hover:text-slate-700 transition-colors text-left">
                Zeit<span className="ml-0.5">{sort.col === 'created_at' ? (sort.dir === 'desc' ? '↓' : '↑') : '↕'}</span>
              </button>
              <span>Typ</span>
              <button onClick={() => toggleSort('driver_name')} className="flex items-center gap-0.5 hover:text-slate-700 transition-colors text-left">
                Fahrer<span className="ml-0.5">{sort.col === 'driver_name' ? (sort.dir === 'desc' ? '↓' : '↑') : '↕'}</span>
              </button>
              <button onClick={() => toggleSort('company_name')} className="flex items-center gap-0.5 hover:text-slate-700 transition-colors text-left">
                Firma<span className="ml-0.5">{sort.col === 'company_name' ? (sort.dir === 'desc' ? '↓' : '↑') : '↕'}</span>
              </button>
              <span>Kennzeichen</span>
              <span>Spr.</span>
              <span>Belehrung</span>
              <span></span>
            </div>

            <div className="flex flex-col gap-1.5">
              {entries.map(entry => (
                <div key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className="grid grid-cols-[100px_140px_80px_1fr_1fr_110px_50px_70px_30px] gap-3 items-center bg-white border border-slate-100 rounded-xl px-4 py-3 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer">
                  <span className="font-mono text-xs text-slate-500 truncate">
                    {entry.reference_number ?? <span className="text-slate-300">—</span>}
                  </span>
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
                  <span className="text-base" title={entry.language}>
                    {LANG_FLAGS[entry.language] ?? entry.language}
                  </span>
                  <span>
                    {entry.briefing_accepted
                      ? <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">✓ Ja</span>
                      : <span className="text-slate-300 text-xs">—</span>}
                  </span>
                  <span className="flex items-center justify-center">
                    {entry.staff_note ? <FileText className="w-4 h-4 text-blue-400" aria-label="Notiz vorhanden" /> : null}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => loadEntries(page - 1, search, typeFilter, sort.col, sort.dir)} disabled={page <= 1}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                ← Zurück
              </button>
              <span className="text-sm text-slate-500">Seite {page} von {totalPages}</span>
              <button onClick={() => loadEntries(page + 1, search, typeFilter, sort.col, sort.dir)} disabled={page >= totalPages}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Weiter →
              </button>
            </div>
          )}
        </>
      )}

      {selectedEntry && (
        <EntryModal
          entry={selectedEntry}
          companyName={companyName}
          logoUrl={logoUrl}
          companyPdfUrl={companyPdfUrl}
          contactPersons={contactPersons}
          signatureData={signatureData}
          onClose={() => setSelectedEntry(null)}
          onNoteUpdated={handleNoteUpdated}
        />
      )}
    </div>
  )
}
