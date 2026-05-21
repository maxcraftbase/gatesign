'use client'

import { useState, useEffect, useRef } from 'react'
import { FileText, Trash2, Mail, Save } from 'lucide-react'

type DigestFormat = 'csv' | 'xlsx' | 'both'

const DIGEST_OPTIONS: { value: DigestFormat; label: string; desc: string }[] = [
  { value: 'both', label: 'CSV + Excel', desc: 'Beide Formate, eines pro Workflow' },
  { value: 'xlsx', label: 'Nur Excel (.xlsx)', desc: 'Formatiert mit Filter und Header' },
  { value: 'csv',  label: 'Nur CSV',          desc: 'Klassisches Text-Format mit Semikolon' },
]

export function DocumentsClient() {
  const [companyPdfUrl, setCompanyPdfUrl] = useState('')
  const [digestFormat, setDigestFormat] = useState<DigestFormat>('both')
  const [originalDigest, setOriginalDigest] = useState<DigestFormat>('both')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings?.company_pdf_url) setCompanyPdfUrl(data.settings.company_pdf_url)
        const fmt = data.settings?.digest_attachment_format as DigestFormat | undefined
        if (fmt === 'csv' || fmt === 'xlsx' || fmt === 'both') {
          setDigestFormat(fmt)
          setOriginalDigest(fmt)
        }
      })
      .catch(() => setError('Fehler beim Laden.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleUpload(file: File) {
    setUploading(true)
    setError('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload-company-pdf', { method: 'POST', body: fd })
    if (res.ok) {
      const data = await res.json() as { url: string }
      setCompanyPdfUrl(data.url)
    } else {
      const data = await res.json() as { error?: string }
      setError(data.error ?? 'Fehler beim Hochladen.')
    }
    setUploading(false)
  }

  async function handleDelete() {
    await fetch('/api/admin/upload-company-pdf', { method: 'DELETE' })
    setCompanyPdfUrl('')
  }

  async function handleSaveDigest() {
    setSaving(true)
    setError('')
    setSaveSuccess(false)
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { digest_attachment_format: digestFormat } }),
    })
    if (res.ok) {
      setOriginalDigest(digestFormat)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } else {
      setError('Format konnte nicht gespeichert werden.')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const digestDirty = digestFormat !== originalDigest

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dokumente</h1>
        <p className="text-slate-500 text-sm mt-1">Unternehmens-PDF und tägliche Tagesbericht-Datei.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>
      )}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 mb-4 text-sm">
          Gespeichert.
        </div>
      )}

      {/* Unternehmens-PDF */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Unternehmens-PDF</h2>
        <p className="text-sm text-slate-500 mb-5">
          Wird beim Drucken automatisch als zusätzliche Seite angehängt (z. B. Geländeplan, Sicherheitsunterweisung).
        </p>

        {companyPdfUrl ? (
          <div className="flex items-center gap-3 px-4 py-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <FileText className="w-6 h-6 text-indigo-600 shrink-0" strokeWidth={1.75} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-indigo-900">company.pdf</p>
              <a href={companyPdfUrl} target="_blank" rel="noreferrer"
                className="text-xs text-indigo-600 hover:underline truncate block">
                Vorschau öffnen
              </a>
            </div>
            <div className="flex gap-2 shrink-0">
              <button type="button" onClick={() => inputRef.current?.click()}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white transition-colors">
                Ersetzen
              </button>
              <button type="button" onClick={handleDelete}
                className="text-slate-400 hover:text-red-500 transition-colors p-1.5">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 py-12 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition-colors">
            <FileText className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">{uploading ? 'Wird hochgeladen…' : 'PDF hochladen'}</p>
              <p className="text-xs text-slate-400 mt-0.5">max. 20 MB</p>
            </div>
          </div>
        )}

        <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) void handleUpload(f); e.target.value = '' }} />
      </div>

      {/* E-Mail-Bericht */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-5 h-5 text-slate-600" strokeWidth={1.75} />
          <h2 className="text-lg font-bold text-slate-900">E-Mail-Bericht</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">
          Format des täglichen Tagesberichts an die hinterlegte Mail-Adresse.
        </p>

        <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Anhang-Format</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          {DIGEST_OPTIONS.map(opt => {
            const selected = digestFormat === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDigestFormat(opt.value)}
                className={`text-left rounded-xl border p-4 transition-colors ${
                  selected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selected ? 'border-indigo-600' : 'border-slate-300'
                  }`}>
                    {selected && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                  </div>
                  <span className={`text-sm font-semibold ${selected ? 'text-indigo-700' : 'text-slate-800'}`}>
                    {opt.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 ml-6">{opt.desc}</p>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-slate-400">
          Der Bericht wird täglich nach Mitternacht für den Vortag versendet, sofern Einträge vorliegen.
        </p>

        {digestDirty && (
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleSaveDigest}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm"
            >
              <Save className="w-4 h-4" strokeWidth={2} />
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
