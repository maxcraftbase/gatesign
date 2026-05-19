'use client'

import { useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import { SignaturePad, type SignaturePadHandle } from '@/components/kiosk/SignaturePad'
import { AvvDocument, AVV_VERSION, AVV_DATE } from '@/lib/avv-content'

type Step = 1 | 2 | 3

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1)

  // Step 1
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Step 2
  const [companyAddress, setCompanyAddress] = useState('')
  const [companyRegisterNo, setCompanyRegisterNo] = useState('')
  const [signerName, setSignerName] = useState('')
  const [signerRole, setSignerRole] = useState('Geschäftsführer/in')
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Step 3
  const [avvAccepted, setAvvAccepted] = useState(false)
  const [hasSigned, setHasSigned] = useState(false)
  const sigPadRef = useRef<SignaturePadHandle>(null)

  // Shared
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const controller = useMemo(() => ({
    companyName,
    address: companyAddress,
    registerInfo: companyRegisterNo || undefined,
    signerName,
    signerRole,
  }), [companyName, companyAddress, companyRegisterNo, signerName, signerRole])

  function validatePassword(pw: string): string | null {
    if (pw.length < 8) return 'Mindestens 8 Zeichen erforderlich.'
    if (!/[A-Z]/.test(pw)) return 'Mindestens ein Großbuchstabe erforderlich.'
    if (!/[a-z]/.test(pw)) return 'Mindestens ein Kleinbuchstabe erforderlich.'
    if (!/[0-9]/.test(pw)) return 'Mindestens eine Zahl erforderlich.'
    return null
  }

  function handleStep1Next(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!companyName.trim() || !email.trim() || !password) {
      setError('Bitte alle Felder ausfüllen.')
      return
    }
    const pwErr = validatePassword(password)
    if (pwErr) { setError(pwErr); return }
    setStep(2)
  }

  function handleStep2Next(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!companyAddress.trim()) { setError('Bitte die Firmenanschrift angeben.'); return }
    if (!signerName.trim()) { setError('Bitte den Namen der unterzeichnenden Person angeben.'); return }
    if (!signerRole.trim()) { setError('Bitte die Funktion angeben.'); return }
    if (!termsAccepted) { setError('Bitte Datenschutz & Nutzungsbedingungen akzeptieren.'); return }
    setStep(3)
  }

  async function handleSubmit() {
    setError('')
    if (!avvAccepted) { setError('Bitte AVV-Annahmeerklärung bestätigen.'); return }
    if (!hasSigned) { setError('Bitte unterschreiben.'); return }
    const signature = sigPadRef.current?.toDataURL() ?? ''
    if (!signature) { setError('Unterschrift konnte nicht erfasst werden.'); return }

    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email, password, companyName,
        companyAddress, companyRegisterNo: companyRegisterNo || null,
        signerName, signerRole,
        termsAccepted: true,
        avvAccepted: true,
        avvVersion: AVV_VERSION,
        signatureData: signature,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Registrierung fehlgeschlagen.')
      setLoading(false)
      return
    }
    window.location.href = `/${data.slug}/admin`
  }

  function clearSignature() {
    sigPadRef.current?.clear()
    setHasSigned(false)
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100'
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5'

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-bold text-slate-900">GateSign</Link>
          <p className="text-slate-500 mt-1 text-sm">Digitales Check-in Terminal für Ihr Unternehmen</p>
        </div>

        <Progress step={step} />

        {step === 1 && (
          <Card title="Konto anlegen" subtitle="Grunddaten — Schritt 1 von 3">
            <form onSubmit={handleStep1Next} className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Firmenname</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                  placeholder="z.B. Muster Logistik GmbH" required autoComplete="organization"
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>E-Mail-Adresse</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="admin@firma.de" required autoComplete="email"
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Passwort</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 Zeichen, Groß- & Kleinbuchstaben, Zahl" required autoComplete="new-password"
                  className={inputCls} />
                <p className="text-xs text-slate-400 mt-1">Min. 8 Zeichen · Groß- &amp; Kleinbuchstaben · Zahl</p>
              </div>

              {error && <ErrorBox text={error} />}

              <button type="submit"
                className="w-full py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors mt-2">
                Weiter zu Firmendaten
              </button>
            </form>
          </Card>
        )}

        {step === 2 && (
          <Card title="Firmendaten" subtitle="Vertragspartner — Schritt 2 von 3">
            <form onSubmit={handleStep2Next} className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Vollständige Firmenanschrift</label>
                <input type="text" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)}
                  placeholder="Musterstraße 1, 12345 Musterstadt" required
                  className={inputCls} />
                <p className="text-xs text-slate-400 mt-1">Wird im AVV als Verantwortlicher eingetragen.</p>
              </div>
              <div>
                <label className={labelCls}>Handelsregister-Nummer (optional)</label>
                <input type="text" value={companyRegisterNo} onChange={e => setCompanyRegisterNo(e.target.value)}
                  placeholder="z.B. Amtsgericht Musterstadt, HRB 12345"
                  className={inputCls} />
              </div>

              <div className="border-t border-slate-100 pt-4 mt-2">
                <p className="text-sm font-semibold text-slate-900 mb-3">Unterzeichnende Person</p>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className={labelCls}>Vor- und Nachname</label>
                    <input type="text" value={signerName} onChange={e => setSignerName(e.target.value)}
                      placeholder="z.B. Max Mustermann" required autoComplete="name"
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Funktion / Position</label>
                    <input type="text" value={signerRole} onChange={e => setSignerRole(e.target.value)}
                      placeholder="z.B. Geschäftsführer/in" required
                      className={inputCls} />
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer mt-3 select-none">
                <div onClick={() => setTermsAccepted(!termsAccepted)}
                  className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                    termsAccepted ? 'bg-slate-900 border-slate-900' : 'border-slate-300 hover:border-slate-500'
                  }`}>
                  {termsAccepted && <span className="text-white text-sm font-bold leading-none">✓</span>}
                </div>
                <span onClick={() => setTermsAccepted(!termsAccepted)} className="text-sm text-slate-700 leading-relaxed">
                  Ich habe die <Link href="/datenschutz" target="_blank" className="underline hover:text-slate-900">Datenschutzerklärung &amp; Nutzungsbedingungen</Link> gelesen und akzeptiere sie.
                </span>
              </label>

              {error && <ErrorBox text={error} />}

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setStep(1)}
                  className="px-5 py-3 bg-slate-100 text-slate-900 font-semibold rounded-xl hover:bg-slate-200 transition-colors">
                  Zurück
                </button>
                <button type="submit"
                  className="flex-1 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors">
                  Weiter zum AVV
                </button>
              </div>
            </form>
          </Card>
        )}

        {step === 3 && (
          <>
            <Card title="Auftragsverarbeitungsvertrag (AVV)" subtitle={`Art. 28 DSGVO · Version ${AVV_VERSION} · Schritt 3 von 3`}>
              <div className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5 leading-relaxed">
                Bitte lesen Sie den AVV. Die Unterzeichnung erfolgt elektronisch durch eine ausdrückliche Annahmeerklärung
                und eine Signatur auf dem Signaturfeld weiter unten. Eine signierte PDF-Fassung wird Ihnen per E-Mail
                zugestellt und ist jederzeit im Admin-Bereich abrufbar.
              </div>
              <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 p-5 bg-white">
                <AvvDocument controller={controller} />
              </div>
            </Card>

            <Card title="Elektronische Unterzeichnung" subtitle="Mit Maus oder Finger im Feld unterschreiben">
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
                  Ich unterzeichne hiermit den vorstehenden AVV in der Version {AVV_VERSION} ({AVV_DATE}) und nehme das Angebot
                  zum Abschluss verbindlich an.
                </span>
              </label>

              {error && <ErrorBox text={error} />}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} disabled={loading}
                  className="px-5 py-3 bg-slate-100 text-slate-900 font-semibold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50">
                  Zurück
                </button>
                <button type="button" onClick={handleSubmit}
                  disabled={loading || !avvAccepted || !hasSigned}
                  className="flex-1 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {loading ? 'Wird eingerichtet…' : 'AVV unterzeichnen & Konto erstellen'}
                </button>
              </div>
            </Card>
          </>
        )}

        <p className="text-center text-sm text-slate-400 mt-4">
          Bereits registriert?{' '}
          <Link href="/login" className="text-slate-700 hover:underline font-medium">Zum Login</Link>
        </p>
      </div>
    </div>
  )
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-4">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function ErrorBox({ text }: { text: string }) {
  return <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{text}</p>
}

function Progress({ step }: { step: Step }) {
  const items = [
    { n: 1, label: 'Konto' },
    { n: 2, label: 'Firma' },
    { n: 3, label: 'AVV' },
  ]
  return (
    <div className="flex items-center gap-2 mb-6">
      {items.map((it, i) => {
        const done = step > it.n
        const active = step === it.n
        return (
          <div key={it.n} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 ${active || done ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                done ? 'bg-emerald-500 text-white' : active ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {done ? '✓' : it.n}
              </div>
              <span className="text-xs font-medium hidden sm:inline">{it.label}</span>
            </div>
            {i < items.length - 1 && (
              <div className={`flex-1 h-px ${step > it.n ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
