'use client'

import { useState, useEffect, useRef } from 'react'
import { Download, Printer, X, Languages } from 'lucide-react'
import { type Entry, LANG_FLAGS, LANG_NAMES } from '@/types/entry'
import { printEntry, downloadPdf } from '@/lib/entry-pdf'

export function EntryModal({ entry, companyName, logoUrl, companyPdfUrl, contactPersons, signatureData, onClose, onNoteUpdated }: {
  entry: Entry
  companyName: string
  logoUrl: string
  companyPdfUrl: string
  contactPersons: string[]
  signatureData: string | null
  onClose: () => void
  onNoteUpdated: (id: string, note: string, translated: string, assignedContact: string | null) => void
}) {
  const [note, setNote] = useState(entry.staff_note ?? '')
  const [translated, setTranslated] = useState(entry.staff_note_translated ?? '')
  const [assignedContact, setAssignedContact] = useState(entry.assigned_contact ?? '')
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [saved, setSaved] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/admin/entries/${entry.id}/note`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_note: note, staff_note_translated: translated, assigned_contact: assignedContact || null }),
      })
      if (res.ok) {
        onNoteUpdated(entry.id, note, translated, assignedContact || null)
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

  useEffect(() => {
    if (!note.trim()) { void Promise.resolve().then(() => setTranslated('')); return }
    if (note === entry.staff_note) return
    const t = setTimeout(() => { void handleTranslate() }, 1200)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note])

  void textareaRef

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{entry.driver_name}</h2>
            <p className="text-sm text-slate-500">{new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(entry.created_at))}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={downloading}
              onClick={async () => {
                setDownloading(true)
                try {
                  await downloadPdf({ ...entry, staff_note: note, staff_note_translated: translated, assigned_contact: assignedContact || null }, companyName, logoUrl, companyPdfUrl)
                } finally { setDownloading(false) }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors disabled:opacity-50">
              <Download className="w-4 h-4" />
              {downloading ? 'Wird erstellt…' : 'PDF'}
            </button>
            <button
              disabled={printing}
              onClick={async () => {
                setPrinting(true)
                try {
                  void fetch(`/api/admin/entries/${entry.id}/print`, { method: 'POST' })
                  await printEntry({ ...entry, staff_note: note, staff_note_translated: translated, assigned_contact: assignedContact || null }, companyName, logoUrl, companyPdfUrl)
                } finally { setPrinting(false) }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors disabled:opacity-50">
              <Printer className="w-4 h-4" />
              {printing ? 'Wird erstellt…' : 'Drucken'}
            </button>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

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
            <p className="text-sm text-slate-900">{entry.visitor_type === 'truck' ? 'LKW-Fahrer' : entry.visitor_type === 'visitor' ? 'Besucher' : entry.visitor_type === 'service' ? 'Dienstleister' : '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Belehrung</p>
            <p className="text-sm">{entry.briefing_accepted ? <span className="text-emerald-600 font-semibold">✓ Akzeptiert</span> : '—'}</p>
          </div>
          <div className={entry.has_signature && signatureData ? 'col-span-2' : ''}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Unterschrift</p>
            {entry.has_signature ? (
              signatureData
                ? <img src={signatureData} alt="Unterschrift" className="mt-1 max-h-24 border border-slate-200 rounded bg-white p-1" />
                : <span className="text-blue-600 font-semibold text-sm">✓ Ja</span>
            ) : <span className="text-sm">—</span>}
          </div>
        </div>

        {contactPersons.length > 0 && (
          <div className="px-6 pt-5 pb-2">
            <label className="text-sm font-semibold text-slate-700 block mb-2">Ansprechpartner (für PDF)</label>
            <div className="flex flex-wrap gap-2">
              {contactPersons.map(person => (
                <button
                  key={person}
                  type="button"
                  onClick={() => setAssignedContact(assignedContact === person ? '' : person)}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-colors ${
                    assignedContact === person
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {person}
                </button>
              ))}
            </div>
          </div>
        )}

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
