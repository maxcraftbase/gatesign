'use client'

import { useState } from 'react'
import { AvvDocument, AVV_VERSION, AVV_DATE } from '@/lib/avv-content'

export function AvvSignClient({
  slug,
  defaultCompanyName,
  adminEmail,
}: {
  slug: string
  defaultCompanyName: string
  adminEmail: string
}) {
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setError('')
    if (!accepted) { setError('Bitte AVV-Annahmeerklärung bestätigen.'); return }

    setLoading(true)
    const res = await fetch('/api/admin/avv/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avvAccepted: true, avvVersion: AVV_VERSION }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Annahme fehlgeschlagen.')
      setLoading(false)
      return
    }
    window.location.reload()
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Auftragsverarbeitungsvertrag (AVV) annehmen</h1>
      <p className="text-sm text-slate-500 mb-6">Art. 28 DSGVO · Version {AVV_VERSION} · Stand {AVV_DATE}</p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6 text-sm text-amber-900 leading-relaxed">
        Der AVV regelt die Auftragsverarbeitung zwischen Ihrem Unternehmen ({defaultCompanyName}) als Verantwortlichem
        und der Alpha Consult GmbH als Auftragsverarbeiterin. Die Annahme erfolgt durch eine ausdrückliche Bestätigung
        (Click-Wrap) — eine handschriftliche Unterschrift ist nach Art. 28 DSGVO nicht erforderlich (Textform genügt).
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-4">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Vertragsinhalt</h2>
        <p className="text-xs text-slate-400 mb-4">Eine PDF-Fassung mit Annahme-Nachweis erhalten Sie nach Bestätigung per E-Mail an {adminEmail}.</p>
        <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 p-5 bg-white">
          <AvvDocument controller={{ companyName: defaultCompanyName }} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <label className="flex items-start gap-3 cursor-pointer select-none mb-4">
          <div onClick={() => setAccepted(!accepted)}
            className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
              accepted ? 'bg-slate-900 border-slate-900' : 'border-slate-300 hover:border-slate-500'
            }`}>
            {accepted && <span className="text-white text-sm font-bold leading-none">✓</span>}
          </div>
          <span onClick={() => setAccepted(!accepted)} className="text-sm text-slate-700 leading-relaxed">
            Ich nehme im Namen von <strong>{defaultCompanyName}</strong> den vorstehenden Auftragsverarbeitungsvertrag
            (Version {AVV_VERSION}, Stand {AVV_DATE}) nach Art. 28 DSGVO verbindlich an.
          </span>
        </label>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}

        <div className="flex gap-3">
          <a href={`/${slug}/admin`}
            className="px-5 py-3 bg-slate-100 text-slate-900 font-semibold rounded-xl hover:bg-slate-200 transition-colors text-center">
            Später
          </a>
          <button type="button" onClick={handleSubmit}
            disabled={loading || !accepted}
            className="flex-1 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? 'Wird angenommen…' : 'Verbindlich annehmen'}
          </button>
        </div>
      </div>
    </div>
  )
}
