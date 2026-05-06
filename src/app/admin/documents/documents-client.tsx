'use client'

import { useState, useEffect, useRef } from 'react'
import { FileText, Trash2 } from 'lucide-react'

export function DocumentsClient() {
  const [companyPdfUrl, setCompanyPdfUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings?.company_pdf_url) setCompanyPdfUrl(data.settings.company_pdf_url)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dokumente</h1>
        <p className="text-slate-500 text-sm mt-1">PDFs die beim Drucken automatisch angehängt werden</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Unternehmens-PDF</h2>
        <p className="text-sm text-slate-500 mb-5">
          Wird beim Drucken automatisch als zusätzliche Seite angehängt (z.B. Geländeplan, Sicherheitsunterweisung).
        </p>

        {companyPdfUrl ? (
          <div className="flex items-center gap-3 px-4 py-4 bg-blue-50 border border-blue-200 rounded-xl">
            <FileText className="w-6 h-6 text-blue-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-900">company.pdf</p>
              <a href={companyPdfUrl} target="_blank" rel="noreferrer"
                className="text-xs text-blue-500 hover:underline truncate block">
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
            className="flex flex-col items-center justify-center gap-3 py-12 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors">
            <FileText className="w-8 h-8 text-slate-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">{uploading ? 'Wird hochgeladen…' : 'PDF hochladen'}</p>
              <p className="text-xs text-slate-400 mt-0.5">max. 20 MB</p>
            </div>
          </div>
        )}

        <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) void handleUpload(f); e.target.value = '' }} />
      </div>
    </div>
  )
}
