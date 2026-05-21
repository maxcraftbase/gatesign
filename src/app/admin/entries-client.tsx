'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Download, RefreshCw, FileText, Search, LogOut, FileSpreadsheet,
  ChevronDown, Truck, User, Wrench, Users as UsersIcon,
  ShieldCheck, MapPin, ClipboardList, CheckCircle2,
} from 'lucide-react'
import { type Entry, VISITOR_TYPE_LABELS, formatDate } from '@/types/entry'
import { EntryModal } from '@/components/admin/EntryModal'

type Kpis = {
  todayCount: number
  currentlyOnSite: number
  truckTodayCount: number
  briefingRate: number
}

// Icon pro Besuchertyp (Card-Head)
function VisitorTypeIcon({ type, className = 'w-5 h-5' }: { type: string | null; className?: string }) {
  if (type === 'truck')   return <Truck   className={className} strokeWidth={1.75} />
  if (type === 'visitor') return <User    className={className} strokeWidth={1.75} />
  if (type === 'service') return <Wrench  className={className} strokeWidth={1.75} />
  return <ClipboardList   className={className} strokeWidth={1.75} />
}

const TYPE_ICON_BG: Record<string, string> = {
  truck:   'bg-amber-50 border-amber-100 text-amber-700',
  visitor: 'bg-blue-50 border-blue-100 text-blue-700',
  service: 'bg-violet-50 border-violet-100 text-violet-700',
}

// Relatives Zeitformat für „letzter Refresh vor X"
function formatRelative(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 5) return 'gerade eben'
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h`
}

// KPI-Card
function KpiCard({
  icon, label, value, sublabel, live = false,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sublabel: string
  live?: boolean
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
          {icon}
        </div>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        {live && (
          <div className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-slate-900 mt-4 tabular-nums leading-none">{value}</p>
      <p className="text-xs text-slate-400 mt-1.5">{sublabel}</p>
    </div>
  )
}

// EntryCard — eine Layout-Logik für Desktop und Mobile
function EntryCard({
  entry, onClick, onCheckout, checkingOut, showNoteIcon,
}: {
  entry: Entry
  onClick: (e: Entry) => void
  onCheckout: (e: React.MouseEvent, id: string) => void
  checkingOut: string | null
  showNoteIcon: boolean
}) {
  const typeKey = entry.visitor_type ?? ''
  const typeInfo = entry.visitor_type ? VISITOR_TYPE_LABELS[entry.visitor_type] : null
  const iconBgClass = TYPE_ICON_BG[typeKey] ?? 'bg-slate-50 border-slate-100 text-slate-500'
  const showCheckout = entry.visitor_type === 'visitor' || entry.visitor_type === 'service'
  const isCheckedOut = !!entry.departed_at

  return (
    <div
      onClick={() => onClick(entry)}
      className="bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-sm rounded-2xl px-4 py-3.5 cursor-pointer transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Typ-Icon links */}
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${iconBgClass}`}>
          <VisitorTypeIcon type={entry.visitor_type} />
        </div>

        {/* Hauptinfo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-base truncate">{entry.driver_name}</span>
            {entry.reference_number && (
              <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {entry.reference_number}
              </span>
            )}
            {showNoteIcon && entry.staff_note && (
              <FileText className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} aria-label="Notiz vorhanden" />
            )}
          </div>
          <div className="mt-0.5 text-sm text-slate-500 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            {typeInfo && <span className="font-medium text-slate-600">{typeInfo.label}</span>}
            {typeInfo && entry.company_name && <span className="text-slate-300">·</span>}
            {entry.company_name && <span className="truncate">{entry.company_name}</span>}
            {entry.license_plate && <span className="text-slate-300">·</span>}
            {entry.license_plate && <span className="font-mono text-slate-600">{entry.license_plate}</span>}
          </div>
        </div>

        {/* Rechte Spalte */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">{formatDate(entry.created_at)}</span>
          <div className="flex items-center gap-1.5">
            {entry.briefing_accepted && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                Belehrt
              </span>
            )}
            {showCheckout && (
              isCheckedOut ? (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                  <LogOut className="w-3 h-3" strokeWidth={2.5} />
                  {new Date(entry.departed_at!).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : (
                <button
                  onClick={(e) => onCheckout(e, entry.id)}
                  disabled={checkingOut === entry.id}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  <LogOut className="w-3 h-3" strokeWidth={2.25} />
                  {checkingOut === entry.id ? 'Lädt…' : 'Abmelden'}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminEntriesClient() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [total, setTotal] = useState(0)
  const [kpis, setKpis] = useState<Kpis | null>(null)
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
  const [terminalFilter, setTerminalFilter] = useState('')
  const [terminals, setTerminals] = useState<{ id: string; name: string }[]>([])
  const [sort, setSort] = useState<{ col: string; dir: 'asc' | 'desc' }>({ col: 'created_at', dir: 'desc' })
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [, setNow] = useState(Date.now())
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  async function handleCheckout(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setCheckingOut(id)
    try {
      const res = await fetch(`/api/admin/entries/${id}/checkout`, { method: 'PATCH' })
      if (res.ok) {
        const now = new Date().toISOString()
        setEntries(prev => prev.map(entry => entry.id === id ? { ...entry, departed_at: now } : entry))
        setKpis(prev => prev ? { ...prev, currentlyOnSite: Math.max(0, prev.currentlyOnSite - 1) } : prev)
        if (selectedEntry?.id === id) setSelectedEntry(e => e ? { ...e, departed_at: now } : e)
      }
    } catch { /* ignore */ } finally {
      setCheckingOut(null)
    }
  }

  const loadEntries = useCallback((p: number, q: string, type: string, terminal: string, sortCol: string, sortDir: 'asc' | 'desc') => {
    setLoading(true)
    setError('')
    const qs = new URLSearchParams({ page: String(p), sort: sortCol, dir: sortDir })
    if (q.trim()) qs.set('search', q.trim())
    if (type) qs.set('type', type)
    if (terminal) qs.set('terminal', terminal)
    fetch(`/api/admin/entries?${qs}`)
      .then(res => { if (!res.ok) throw new Error('Failed'); return res.json() })
      .then(data => {
        setEntries(data.entries ?? [])
        setTotal(data.total ?? 0)
        setKpis(data.kpis ?? null)
        setCompanyName(data.companyName ?? '')
        setLogoUrl(data.logoUrl ?? '')
        if (data.contactPersons) setContactPersons(data.contactPersons)
        setCompanyPdfUrl(data.companyPdfUrl ?? '')
        if (data.terminals) setTerminals(data.terminals)
        setPage(p)
        setLastRefresh(new Date())
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
    const t = setTimeout(() => loadEntries(1, search, typeFilter, terminalFilter, sort.col, sort.dir), isSearchChange ? 350 : 0)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, terminalFilter, sort])

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

  // Auto-Refresh alle 30 s
  useEffect(() => {
    const id = setInterval(() => {
      const qs = new URLSearchParams({ page: String(page), sort: sort.col, dir: sort.dir })
      if (search.trim()) qs.set('search', search.trim())
      if (typeFilter) qs.set('type', typeFilter)
      if (terminalFilter) qs.set('terminal', terminalFilter)
      fetch(`/api/admin/entries?${qs}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (!data) return
          const newEntries: Entry[] = data.entries ?? []
          setEntries(newEntries)
          setTotal(data.total ?? 0)
          setKpis(data.kpis ?? null)
          setLastRefresh(new Date())
          setSelectedEntry(prev => {
            if (!prev) return prev
            const refreshed = newEntries.find(e => e.id === prev.id)
            return refreshed ?? prev
          })
        })
        .catch(() => {})
    }, 30_000)
    return () => clearInterval(id)
  }, [search, typeFilter, terminalFilter, sort, page])

  // „vor X s"-Anzeige live updaten
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(id)
  }, [])

  // Export-Menü Outside-Click schließen
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function handleNoteUpdated(id: string, note: string, translated: string, assignedContact: string | null) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, staff_note: note, staff_note_translated: translated, assigned_contact: assignedContact } : e))
    if (selectedEntry?.id === id) setSelectedEntry(e => e ? { ...e, staff_note: note, staff_note_translated: translated, assigned_contact: assignedContact } : e)
  }

  const totalPages = Math.max(1, Math.ceil(total / 50))
  const refresh = () => loadEntries(page, search, typeFilter, terminalFilter, sort.col, sort.dir)

  return (
    <div>
      {/* Page-Header — schlank */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Übersicht</h1>
        <p className="text-sm text-slate-500 mt-1">Aktuelle Check-ins und Audit-Lage.</p>
      </div>

      {/* KPI-Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={<UsersIcon className="w-4 h-4" strokeWidth={1.75} />}
          label="Heute"
          value={kpis ? kpis.todayCount : '—'}
          sublabel="Check-ins gesamt"
        />
        <KpiCard
          icon={<MapPin className="w-4 h-4" strokeWidth={1.75} />}
          label="Auf Gelände"
          value={kpis ? kpis.currentlyOnSite : '—'}
          sublabel="aktuell anwesend"
          live
        />
        <KpiCard
          icon={<Truck className="w-4 h-4" strokeWidth={1.75} />}
          label="LKW heute"
          value={kpis ? kpis.truckTodayCount : '—'}
          sublabel="Anlieferungen"
        />
        <KpiCard
          icon={<ShieldCheck className="w-4 h-4" strokeWidth={1.75} />}
          label="Belehrt"
          value={kpis ? `${kpis.briefingRate}%` : '—'}
          sublabel="heutige Rate"
        />
      </div>

      {/* Toolbar — Suche, Filter, Actions in einer Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 mb-4">
        <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
          {/* Suche */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Suche nach Name, Referenz oder Firma…"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white"
            />
          </div>

          {/* Typ-Filter */}
          <div className="flex gap-1 flex-shrink-0">
            {([['', 'Alle'], ['truck', 'LKW'], ['visitor', 'Besucher'], ['service', 'Dienst']] as [string, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTypeFilter(val)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${
                  typeFilter === val
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Terminal-Filter (nur wenn >1 Terminal) */}
          {terminals.length > 1 && (
            <select
              value={terminalFilter}
              onChange={e => setTerminalFilter(e.target.value)}
              className="text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 flex-shrink-0"
            >
              <option value="">Alle Terminals</option>
              {terminals.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0 lg:ml-auto">
            <button
              onClick={refresh}
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="Aktualisieren"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
            </button>

            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setExportMenuOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-4 h-4" strokeWidth={2} />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} strokeWidth={2.25} />
              </button>
              {exportMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30">
                  <button
                    onClick={() => { setExportMenuOpen(false); window.open('/api/admin/export', '_blank') }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Download className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                    CSV-Datei
                  </button>
                  <button
                    onClick={() => { setExportMenuOpen(false); window.open('/api/admin/export/xlsx', '_blank') }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                    Excel (.xlsx)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live-Indikator */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live · letzter Refresh vor {formatRelative(lastRefresh)}</span>
          </div>
          <span className="tabular-nums">
            {total} {search || typeFilter || terminalFilter ? 'gefiltert' : 'Einträge'}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Liste */}
      {loading && entries.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-slate-500 font-medium">
            {search || typeFilter || terminalFilter ? 'Keine Treffer in dieser Auswahl.' : 'Noch keine Check-ins.'}
          </p>
          {(search || typeFilter || terminalFilter) && (
            <button
              onClick={() => { setSearch(''); setTypeFilter(''); setTerminalFilter('') }}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold mt-3"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onClick={setSelectedEntry}
              onCheckout={handleCheckout}
              checkingOut={checkingOut}
              showNoteIcon
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => loadEntries(page - 1, search, typeFilter, terminalFilter, sort.col, sort.dir)}
            disabled={page <= 1}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Zurück
          </button>
          <span className="text-sm text-slate-500 tabular-nums">Seite {page} von {totalPages}</span>
          <button
            onClick={() => loadEntries(page + 1, search, typeFilter, terminalFilter, sort.col, sort.dir)}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Weiter →
          </button>
        </div>
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
