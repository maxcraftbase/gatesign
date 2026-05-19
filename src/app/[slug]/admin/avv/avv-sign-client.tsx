'use client'

import { useState, useRef, useMemo } from 'react'
import { SignaturePad, type SignaturePadHandle } from '@/components/kiosk/SignaturePad'
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
  const [companyAddress, setCompanyAddress] = useState('')
  const [companyRegisterNo, setCompanyRegisterNo] = useState('')
  const [signerName, setSignerName] = useState('')
  const [signerRole, setSignerRole] = useState('Geschäftsführer/in')
  const [avvAccepted, setAvvAccepted] = useState(false)
  const [hasSigned, setHasSigned] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const sigPadRef = useRef<SignaturePadHandle>(null)

  const controller = useMemo(() => ({
    companyName: defaultCompanyName,
    address: companyAddress,
    registerInfo: companyRegisterNo || undefined,
    signerName,
    signerRole,
  }), [defaultCompanyName, companyAddress, companyRegisterNo, signerName, signerRole])

  async function handleSubmit() {
    setError('')
    if (!companyAddress.trim()) { setError('Bitte Firmenanschrift angeben.'); return }
    if (!signerName.trim()) { setError('Bitte Namen der unterzeichnenden Person angeben.'); return }
    if (!signerRole.trim()) { setError('Bitte Funktion angeben.'); return }
    if (!avvAccepted) { setError('Bitte AVV-Annahmeerklärung bestätigen.'); return }
    if (!hasSigned) { setError('Bitte unterschreiben.'); return }
    const signature = sigPadRef.current?.toDataURL() ?? ''
    if (!signature) { setError('Unterschrift konnte nicht erfasst werden.'); return }

    setLoading(true)
    const res = await fetch('/api/admin/avv/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyAddress,
        companyRegisterNo: companyRegisterNo || null,
        signerName,
        signerRole,
        avvVersion: AVV_VERSION,
        signatureData: signature,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Unterzeichnung fehlgeschlagen.')
      setLoading(false)
      return
    }
    window.location.reload()
  }

  function clearSignature() {
    sigPadRef.current?.clear()
    setHasSigned(false)
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100'
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5'

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Auftragsverarbeitungsvertrag (AVV) unterzeichnen</h1>
      <p className="text-sm text-slate-500 mb-6">Art. 28 DSGVO · Version {AVV_VERSION} · Stand {AVV_DATE}</p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6 text-sm text-amber-900 leading-relaxed">
        Der AVV regelt die Auftragsverarbeitung zwischen Ihrem Unternehmen ({defaultCompanyName}) als Verantwortlichem und der
        Alpha Consult GmbH als Auftragsverarbeiterin. Bitte tragen Sie Ihre Firmendaten ein und unterzeichnen Sie elektronisch.
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-4">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Firmendaten</h2>
        <p className="text-xs text-slate-400 mb-5">Werden als Verantwortlicher im AVV eingetragen. {adminEmail} ist als Kontakt hinterlegt.</p>
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Vollständige Firmenanschrift</label>
            <input type="text" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)}
              placeholder="Musterstraße 1, 12345 Musterstadt" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Handelsregister-Nummer (optional)</label>
            <input type="text" value={companyRegisterNo} onChange={e => setCompanyRegisterNo(e.target.value)}
              placeholder="z.B. Amtsgericht Musterstadt, HRB 12345" className={inputCls} />
          </div>
          <div className="border-t border-slate-100 pt-4 mt-1">
            <p className="text-sm font-semibold text-slate-900 mb-3">Unterzeichnende Person</p>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Vor- und Nachname</label>
                <input type="text" value={signerName} onChange={e => setSignerName(e.target.value)}
                  placeholder="z.B. Max Mustermann" autoComplete="name" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Funktion / Position</label>
                <input type="text" value={signerRole} onChange={e => setSignerRole(e.target.value)}
                  placeholder="z.B. Geschäftsführer/in" className={inputCls} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-4">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Vertragsinhalt</h2>
        <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-slate-200 p-5 bg-white">
          <AvvDocument controller={controller} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-4">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Elektronische Unterzeichnung</h2>
        <p className="text-xs text-slate-400 mb-4">Mit Maus oder Finger im Feld unterschreiben.</p>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Unterschrift {signerName ? `(${signerName})` : ''}</span>
          <button type="button" onClick={clearSignature}
            className="text-xs text-slate-500 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
            Löschen
          </button>
        </div>
        <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden relative mb-4">
          <SignaturePad ref={sigPadRef} className="w-full h-32 block" onSign={() => setHasSigned(true)} />
          {!hasSigned && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-slate-400 text-sm">Hier unterschreiben</span>
            </div>
          )}
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none mb-4">
          <div onClick={() => setAvvAccepted(!avvAccepted)}
            className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
              avvAccepted ? 'bg-slate-900 border-slate-900' : 'border-slate-300 hover:border-slate-500'
            }`}>
            {avvAccepted && <span className="text-white text-sm font-bold leading-none">✓</span>}
          </div>
          <span onClick={() => setAvvAccepted(!avvAccepted)} className="text-sm text-slate-700 leading-relaxed">
            Ich unterzeichne hiermit den vorstehenden AVV in der Version {AVV_VERSION} ({AVV_DATE}) und nehme das Angebot zum
            Abschluss verbindlich an.
          </span>
        </label>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}

        <div className="flex gap-3">
          <a href={`/${slug}/admin`}
            className="px-5 py-3 bg-slate-100 text-slate-900 font-semibold rounded-xl hover:bg-slate-200 transition-colors text-center">
            Später
          </a>
          <button type="button" onClick={handleSubmit}
            disabled={loading || !avvAccepted || !hasSigned}
            className="flex-1 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? 'Wird unterzeichnet…' : 'AVV unterzeichnen'}
          </button>
        </div>
      </div>
    </div>
  )
}
