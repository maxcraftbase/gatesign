'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Download, RefreshCw, Printer, X, Languages, FileText } from 'lucide-react'

interface Entry {
  id: string
  created_at: string
  driver_name: string
  company_name: string
  license_plate: string
  trailer_plate: string | null
  phone: string | null
  language: string
  briefing_accepted: boolean
  briefing_accepted_at: string | null
  has_signature: boolean
  reference_number: string | null
  visitor_type: string | null
  contact_person: string | null
  staff_note: string | null
  staff_note_translated: string | null
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

const LANG_NAMES: Record<string, string> = {
  de: 'Deutsch', en: 'Englisch', pl: 'Polnisch', ro: 'Rumänisch', cs: 'Tschechisch',
  hu: 'Ungarisch', bg: 'Bulgarisch', uk: 'Ukrainisch', ru: 'Russisch', tr: 'Türkisch',
}

const VISITOR_TYPE_FULL: Record<string, string> = {
  truck: 'LKW-Fahrer', visitor: 'Besucher', service: 'Dienstleister',
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
  } catch { return iso }
}

// ─── Print PDF ────────────────────────────────────────────────────────────────
function printEntry(entry: Entry, companyName: string, logoUrl?: string) {
  const flag = LANG_FLAGS[entry.language] ?? ''
  const langName = LANG_NAMES[entry.language] ?? entry.language
  const date = formatDate(entry.created_at)
  const note = entry.staff_note_translated || entry.staff_note || ''

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8"/>
<title>Check-in — ${entry.driver_name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; font-size: 14px; }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
  .header-left { display: flex; align-items: center; gap: 16px; }
  .logo { max-height: 52px; max-width: 160px; object-fit: contain; }
  .company-name { font-size: 20px; font-weight: 700; color: #0f172a; }
  .header-right { text-align: right; }
  .doc-title { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
  .doc-date { font-size: 12px; color: #94a3b8; margin-top: 2px; }
  .grid { display: grid; grid-template-columns: 180px 1fr; gap: 10px 16px; margin-bottom: 24px; }
  .label { color: #64748b; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; padding-top: 2px; }
  .value { font-size: 15px; font-weight: 500; }
  .plate { display: inline-block; padding: 3px 12px; border-radius: 4px; font-size: 13px; font-weight: 700; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; letter-spacing: 0.04em; font-family: monospace; }
  .plate-sep { font-size: 11px; color: #94a3b8; margin: 0 4px; vertical-align: middle; }
  .note-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-top: 8px; }
  .note-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
  .note-text { font-size: 14px; color: #334155; line-height: 1.6; }
  .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
  .footer { font-size: 10px; color: #cbd5e1; margin-top: 40px; text-align: center; }
  .check { color: #10b981; font-weight: bold; }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="${companyName}"/>` : ''}
    <div class="company-name">${companyName}</div>
  </div>
  <div class="header-right">
    <div class="doc-title">Check-in Bestätigung</div>
    <div class="doc-date">${date}</div>
  </div>
</div>

<div class="grid">
  <div class="label">Name</div><div class="value">${entry.driver_name}</div>
  <div class="label">Firma</div><div class="value">${entry.company_name}</div>
  <div class="label">Kennzeichen</div>
  <div class="value">
    <span class="plate">${entry.license_plate}</span>
    ${entry.trailer_plate ? `<span class="plate-sep">·</span><span class="plate">${entry.trailer_plate}</span><span style="font-size:11px;color:#94a3b8;margin-left:4px">(Anhänger)</span>` : ''}
  </div>
  ${entry.phone ? `<div class="label">Telefon</div><div class="value">${entry.phone}</div>` : ''}
  ${entry.contact_person ? `<div class="label">Ansprechpartner</div><div class="value">${entry.contact_person}</div>` : ''}
  ${entry.reference_number ? `<div class="label">Referenz</div><div class="value">${entry.reference_number}</div>` : ''}
  <div class="label">Besuchertyp</div><div class="value">${VISITOR_TYPE_FULL[entry.visitor_type ?? ''] ?? entry.visitor_type ?? '—'}</div>
  <div class="label">Sprache</div><div class="value">${flag} ${langName}</div>
  <div class="label">Sicherheitsbelehrung</div><div class="value">${entry.briefing_accepted ? '<span class="check">✓ Akzeptiert</span>' : '—'}</div>
  <div class="label">Unterschrift</div><div class="value">${entry.has_signature ? '<span class="check">✓ Ja</span>' : '—'}</div>
</div>
${note ? `<hr class="divider"/><div class="note-box"><div class="note-label">Hinweis vom Unternehmen</div><div class="note-text">${note}</div></div>` : ''}
<div class="footer">Erstellt mit GateSign · gatesign.de</div>
</body>
</html>`

  const w = window.open('', '_blank', 'width=800,height=900')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => { w.print(); w.close() }, 400)
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function EntryModal({ entry, companyName, logoUrl, onClose, onNoteUpdated }: {
  entry: Entry
  companyName: string
  logoUrl: string
  onClose: () => void
  onNoteUpdated: (id: string, note: string, translated: string) => void
}) {
  const [note, setNote] = useState(entry.staff_note ?? '')
  const [translated, setTranslated] = useState(entry.staff_note_translated ?? '')
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [saved, setSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/admin/entries/${entry.id}/note`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_note: note, staff_note_translated: translated }),
      })
      if (res.ok) {
        onNoteUpdated(entry.id, note, translated)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleTranslate() {
    if (!note.trim()) return
    setTranslating(true)
    try {
      const res = await fetch('/api/admin/translate-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: note, targetLanguage: entry.language }),
      })
      if (res.ok) {
        const data = await res.json() as { translated: string }
        setTranslated(data.translated)
      }
    } finally {
      setTranslating(false)
    }
  }

  // auto-translate when note changes (debounced)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!note.trim()) { setTranslated(''); return }
    if (note === entry.staff_note) return
    const t = setTimeout(() => { void handleTranslate() }, 1200)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{entry.driver_name}</h2>
            <p className="text-sm text-slate-500">{formatDate(entry.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => {
              void fetch(`/api/admin/entries/${entry.id}/print`, { method: 'POST' })
              printEntry({ ...entry, staff_note: note, staff_note_translated: translated }, companyName, logoUrl)
            }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors">
              <Printer className="w-4 h-4" />
              Drucken
            </button>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="px-6 py-5 grid grid-cols-2 gap-x-8 gap-y-3 border-b border-slate-100">
          {entry.reference_number && (
            <div className="col-span-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Referenz</p>
              <p className="text-sm font-bold text-slate-900">{entry.reference_number}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Firma</p>
            <p className="text-sm text-slate-900">{entry.company_name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Kennzeichen</p>
            <p className="text-sm font-mono bg-slate-100 px-2 py-0.5 rounded w-fit">{entry.license_plate}{entry.trailer_plate ? ` + ${entry.trailer_plate}` : ''}</p>
          </div>
          {entry.phone && <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Telefon</p>
            <p className="text-sm text-slate-900">{entry.phone}</p>
          </div>}
          {entry.contact_person && <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Ansprechpartner</p>
            <p className="text-sm text-slate-900">{entry.contact_person}</p>
          </div>}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Sprache</p>
            <p className="text-sm text-slate-900">{LANG_FLAGS[entry.language]} {LANG_NAMES[entry.language] ?? entry.language}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Typ</p>
            <p className="text-sm text-slate-900">{VISITOR_TYPE_FULL[entry.visitor_type ?? ''] ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Belehrung</p>
            <p className="text-sm">{entry.briefing_accepted ? <span className="text-emerald-600 font-semibold">✓ Akzeptiert</span> : '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Unterschrift</p>
            <p className="text-sm">{entry.has_signature ? <span className="text-blue-600 font-semibold">✓ Ja</span> : '—'}</p>
          </div>
        </div>

        {/* Staff Note */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-700">Mitarbeiter-Notiz</label>
            {translating && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 animate-pulse" />
                Übersetze…
              </span>
            )}
          </div>
          <textarea
            ref={textareaRef}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Notiz auf Deutsch eingeben — wird automatisch in die Fahrersprache übersetzt…"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 resize-none"
          />
          {translated && note && (
            <div className="mt-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
                Übersetzt ({LANG_FLAGS[entry.language]} {LANG_NAMES[entry.language]})
              </p>
              <p className="text-sm text-blue-900">{translated}</p>
            </div>
          )}
          <div className="flex items-center justify-between mt-3">
            {saved ? (
              <span className="text-sm text-emerald-600 font-medium">✓ Gespeichert</span>
            ) : <span />}
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors">
              {saving ? 'Speichern…' : 'Notiz speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AdminEntriesClient() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

  const loadEntries = useCallback((p: number) => {
    setLoading(true)
    setError('')
    fetch(`/api/admin/entries?page=${p}`)
      .then(res => { if (!res.ok) throw new Error('Failed'); return res.json() })
      .then(data => {
        setEntries(data.entries ?? [])
        setTotal(data.total ?? 0)
        setCompanyName(data.companyName ?? '')
        setLogoUrl(data.logoUrl ?? '')
        setPage(p)
      })
      .catch(() => setError('Fehler beim Laden der Einträge.'))
      .finally(() => setLoading(false))
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadEntries(1) }, [loadEntries])

  function handleNoteUpdated(id: string, note: string, translated: string) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, staff_note: note, staff_note_translated: translated } : e))
    if (selectedEntry?.id === id) setSelectedEntry(e => e ? { ...e, staff_note: note, staff_note_translated: translated } : e)
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
          <button onClick={() => loadEntries(page)}
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
            {/* Header */}
            <div className="grid grid-cols-[100px_140px_80px_1fr_1fr_110px_50px_70px_30px] gap-3 px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Referenz</span>
              <span>Zeit</span>
              <span>Typ</span>
              <span>Fahrer</span>
              <span>Firma</span>
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
                    {entry.staff_note
                      ? <FileText className="w-4 h-4 text-blue-400" aria-label="Notiz vorhanden" />
                      : null}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => loadEntries(page - 1)} disabled={page <= 1}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                ← Zurück
              </button>
              <span className="text-sm text-slate-500">Seite {page} von {totalPages}</span>
              <button onClick={() => loadEntries(page + 1)} disabled={page >= totalPages}
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
          onClose={() => setSelectedEntry(null)}
          onNoteUpdated={handleNoteUpdated}
        />
      )}
    </div>
  )
}
