'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { CheckCircle, Lock } from 'lucide-react'
import { translations, LANGUAGES, VISITOR_TYPES, type Language, type VisitorType } from '@/lib/translations'
import { SignaturePad, type SignaturePadHandle } from '@/components/kiosk/SignaturePad'

// ─── Simple markdown renderer (no external dependency) ───────────────────────
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []

  lines.forEach((line, i) => {
    if (line.startsWith('# ')) {
      nodes.push(
        <h2 key={i} className="text-2xl font-bold text-slate-900 mb-4 mt-2">
          {line.slice(2)}
        </h2>
      )
    } else if (line.match(/^\d+\.\s/)) {
      const content = line.replace(/^\d+\.\s/, '')
      nodes.push(
        <li key={i} className="mb-3 text-slate-700 text-lg leading-relaxed">
          {renderInline(content)}
        </li>
      )
    } else if (line.trim() === '') {
      nodes.push(<br key={i} />)
    } else {
      nodes.push(
        <p key={i} className="text-slate-700 text-lg leading-relaxed mb-2">
          {renderInline(line)}
        </p>
      )
    }
  })

  return nodes
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-900">{part}</strong> : part
  )
}

// ─── Admin login modal ───────────────────────────────────────────────────────
function AdminLoginModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Login failed')
        setLoading(false)
        return
      }
      window.location.href = '/admin'
    } catch {
      setError('Network error')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Admin-Login</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base outline-none focus:border-slate-900"
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base outline-none focus:border-slate-900"
            required
          />
          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? '…' : 'Anmelden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step, lang }: { step: number; lang: Language }) {
  const t = translations[lang]
  const steps = [t.step_language, t.step_type, t.step_form, t.step_briefing, t.step_success]
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-1 flex-1">
          <div className={`flex items-center gap-1.5 ${i + 1 <= step ? 'opacity-100' : 'opacity-40'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
              i + 1 < step ? 'bg-emerald-500 text-white' :
              i + 1 === step ? 'bg-blue-600 text-white' :
              'bg-slate-700 text-slate-400'
            }`}>
              {i + 1 < step ? '✓' : i + 1}
            </div>
            <span className="text-xs font-medium text-slate-200 hidden md:block">{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 mx-1 rounded transition-colors ${i + 1 < step ? 'bg-emerald-500' : 'bg-slate-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Step 2: Visitor type select ──────────────────────────────────────────────
function VisitorTypeSelect({ lang, onSelect }: { lang: Language; onSelect: (t: VisitorType) => void }) {
  const t = translations[lang]
  return (
    <div className="flex flex-col flex-1 px-6 py-4">
      <h2 className="text-3xl font-bold text-white text-center mb-8">{t.choose_type}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto w-full">
        {VISITOR_TYPES.map(({ type, icon, labelKey }) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="flex flex-col items-center gap-4 bg-slate-800 hover:bg-slate-700 active:scale-95 active:bg-blue-600 transition-all rounded-2xl p-8 border border-slate-700 hover:border-blue-500"
          >
            <span className="text-6xl">{icon}</span>
            <span className="text-white font-bold text-xl text-center">{t[labelKey]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Step 0: Welcome ──────────────────────────────────────────────────────────
function WelcomeScreen({
  title,
  subtitle,
  onStart,
}: {
  title: string
  subtitle: string
  onStart: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-10 px-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4 leading-tight">{title}</h1>
        <p className="text-2xl text-slate-300">{subtitle}</p>
      </div>
      <button
        onClick={onStart}
        className="bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white text-3xl font-bold px-16 py-6 rounded-2xl shadow-lg"
      >
        Check-in starten
      </button>
    </div>
  )
}

// ─── Step 1: Language select ──────────────────────────────────────────────────
function LanguageSelect({ onSelect }: { onSelect: (lang: Language) => void }) {
  return (
    <div className="flex flex-col flex-1 px-6 py-4">
      <h2 className="text-3xl font-bold text-white text-center mb-8">
        Sprache wählen / Choose language
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-4xl mx-auto w-full">
        {LANGUAGES.map(lang => (
          <button
            key={lang.code}
            onClick={() => onSelect(lang.code)}
            className="flex flex-col items-center gap-3 bg-slate-800 hover:bg-slate-700 active:scale-95 active:bg-blue-600 transition-all rounded-2xl p-5 border border-slate-700 hover:border-blue-500"
          >
            <span className="text-5xl">{lang.flag}</span>
            <span className="text-white font-semibold text-lg">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Step 3: Driver form ──────────────────────────────────────────────────────
interface FormData {
  name: string
  company: string
  plate: string
  trailerPlate: string
  phone: string
  reference: string
  contactPerson: string
}

function DriverForm({
  lang,
  visitorType,
  formData,
  onChange,
  onNext,
  onBack,
}: {
  lang: Language
  visitorType: VisitorType
  formData: FormData
  onChange: (f: FormData) => void
  onNext: () => void
  onBack: () => void
}) {
  const t = translations[lang]
  const [error, setError] = useState('')

  function handleNext() {
    if (!formData.name.trim() || !formData.company.trim() || !formData.plate.trim()) {
      setError(t.required_fields)
      return
    }
    setError('')
    onNext()
  }

  const inputCls = 'w-full px-5 py-4 rounded-xl border border-slate-200 text-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors placeholder:text-slate-400'
  const labelCls = 'text-lg font-semibold text-slate-700 mb-1 block'

  return (
    <div className="flex flex-col flex-1 px-6 py-2 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6 max-w-2xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">{t.form_title}</h2>
        <div className="flex flex-col gap-5">
          <div>
            <label className={labelCls}>{t.field_name} <span className="text-red-500">*</span></label>
            <input className={inputCls} placeholder={t.field_name_placeholder}
              value={formData.name} onChange={e => onChange({ ...formData, name: e.target.value })} autoComplete="off" />
          </div>
          <div>
            <label className={labelCls}>{t.field_company} <span className="text-red-500">*</span></label>
            <input className={inputCls} placeholder={t.field_company_placeholder}
              value={formData.company} onChange={e => onChange({ ...formData, company: e.target.value })} autoComplete="off" />
          </div>
          <div>
            <label className={labelCls}>{t.field_plate} <span className="text-red-500">*</span></label>
            <input className={inputCls} placeholder={t.field_plate_placeholder}
              value={formData.plate} onChange={e => onChange({ ...formData, plate: e.target.value.toUpperCase() })}
              autoComplete="off" autoCapitalize="characters" />
          </div>
          {visitorType === 'truck' && (
            <div>
              <label className={labelCls}>{t.field_trailer_plate}</label>
              <input className={inputCls} placeholder={t.field_trailer_placeholder}
                value={formData.trailerPlate} onChange={e => onChange({ ...formData, trailerPlate: e.target.value.toUpperCase() })}
                autoComplete="off" autoCapitalize="characters" />
            </div>
          )}
          <div>
            <label className={labelCls}>{t.field_phone}</label>
            <input className={inputCls} placeholder={t.field_phone_placeholder}
              value={formData.phone} onChange={e => onChange({ ...formData, phone: e.target.value })}
              type="tel" autoComplete="off" />
          </div>
          {visitorType === 'truck' && (
            <div>
              <label className={labelCls}>{t.field_reference}</label>
              <input className={inputCls} placeholder={t.field_reference_placeholder}
                value={formData.reference} onChange={e => onChange({ ...formData, reference: e.target.value })}
                autoComplete="off" />
            </div>
          )}
          {(visitorType === 'visitor' || visitorType === 'service') && (
            <div>
              <label className={labelCls}>{t.field_contact_person} <span className="text-red-500">*</span></label>
              <input className={inputCls} placeholder={t.field_contact_placeholder}
                value={formData.contactPerson} onChange={e => onChange({ ...formData, contactPerson: e.target.value })}
                autoComplete="off" />
            </div>
          )}
          {error && (
            <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3 text-lg font-medium">{error}</p>
          )}
        </div>
      </div>
      <div className="flex gap-4 mt-4 max-w-2xl mx-auto w-full pb-4">
        <button onClick={onBack}
          className="flex-1 py-5 text-xl font-semibold rounded-2xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-white transition-all">
          {t.btn_back}
        </button>
        <button onClick={handleNext}
          className="flex-grow-[2] py-5 text-xl font-semibold rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white transition-all">
          {t.btn_next}
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Safety briefing ──────────────────────────────────────────────────
function SafetyBriefingStep({
  lang,
  briefingContent,
  signatureRequired,
  onConfirm,
  onBack,
}: {
  lang: Language
  briefingContent: string
  signatureRequired: boolean
  onConfirm: (signatureData: string | null) => void
  onBack: () => void
}) {
  const t = translations[lang]
  const [accepted, setAccepted] = useState(false)
  const [hasSigned, setHasSigned] = useState(false)
  const sigPadRef = useRef<SignaturePadHandle>(null)

  function handleConfirm() {
    if (!accepted) return
    if (signatureRequired && !hasSigned) return
    const sigData = hasSigned ? sigPadRef.current?.toDataURL() ?? null : null
    onConfirm(sigData)
  }

  function handleClear() {
    sigPadRef.current?.clear()
    setHasSigned(false)
  }

  const canConfirm = accepted && (!signatureRequired || hasSigned)

  return (
    <div className="flex flex-col flex-1 px-6 py-2 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6 max-w-2xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-slate-900 mb-5">{t.briefing_title}</h2>
        <div className="border border-slate-200 rounded-xl p-5 max-h-80 overflow-y-auto bg-slate-50 mb-6">
          <div className="prose-custom">
            {renderMarkdown(briefingContent)}
          </div>
        </div>

        {/* Signature pad */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-lg font-semibold text-slate-700">{t.signature_title}</label>
            <button
              type="button"
              onClick={handleClear}
              className="text-sm text-slate-500 hover:text-red-500 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
            >
              {t.signature_clear}
            </button>
          </div>
          <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden relative">
            <SignaturePad
              ref={sigPadRef}
              className="w-full h-36 block"
              onSign={() => setHasSigned(true)}
            />
            {!hasSigned && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-slate-400 text-base">
                  {lang === 'de' ? 'Hier unterschreiben' : 'Sign here'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Accept checkbox */}
        <label className="flex items-start gap-4 cursor-pointer select-none">
          <div
            onClick={() => setAccepted(!accepted)}
            className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
              accepted ? 'bg-blue-600 border-blue-600' : 'border-slate-300 hover:border-blue-400'
            }`}
          >
            {accepted && <span className="text-white text-lg font-bold">✓</span>}
          </div>
          <span
            onClick={() => setAccepted(!accepted)}
            className="text-lg text-slate-700 leading-relaxed"
          >
            {t.briefing_accept_label}
          </span>
        </label>
      </div>

      <div className="flex gap-4 mt-4 max-w-2xl mx-auto w-full pb-4">
        <button
          onClick={onBack}
          className="flex-1 py-5 text-xl font-semibold rounded-2xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-white transition-all"
        >
          {t.btn_back}
        </button>
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="flex-grow-[2] py-5 text-xl font-semibold rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all"
        >
          {t.btn_confirm}
        </button>
      </div>
    </div>
  )
}

// ─── Step 4: Success ──────────────────────────────────────────────────────────
function SuccessScreen({
  lang,
  onReset,
}: {
  lang: Language
  onReset: () => void
}) {
  const t = translations[lang]
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval)
          onReset()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [onReset])

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 px-8">
      <div className="bg-white rounded-3xl shadow-lg p-12 text-center max-w-lg w-full">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-24 h-24 text-emerald-500" strokeWidth={1.5} />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 mb-3">{t.success_title}</h2>
        <p className="text-2xl text-slate-600 mb-3">{t.success_subtitle}</p>
        <p className="text-lg text-slate-400 mb-8">{t.success_hint}</p>
        <button
          onClick={onReset}
          className="w-full py-4 text-xl font-semibold rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white transition-all"
        >
          {t.btn_new_checkin}
        </button>
        <p className="text-slate-400 text-base mt-4">
          {lang === 'de' ? `Automatischer Reset in ${countdown}s` : `Auto-reset in ${countdown}s`}
        </p>
      </div>
    </div>
  )
}

// ─── Main kiosk component ─────────────────────────────────────────────────────
const EMPTY_FORM: FormData = { name: '', company: '', plate: '', trailerPlate: '', phone: '', reference: '', contactPerson: '' }

export function KioskClient() {
  const [step, setStep] = useState(0)
  const [lang, setLang] = useState<Language>('de')
  const [visitorType, setVisitorType] = useState<VisitorType>('truck')
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [briefingContent, setBriefingContent] = useState('')
  const [briefingVersion, setBriefingVersion] = useState('1.0')
  const [signatureRequired, setSignatureRequired] = useState(false)
  const [welcomeTitle, setWelcomeTitle] = useState('Willkommen / Welcome')
  const [welcomeSubtitle, setWelcomeSubtitle] = useState('Bitte melden Sie sich hier an — Please register here')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [adminModalOpen, setAdminModalOpen] = useState(false)

  const adminTapCount = useRef(0)
  const adminTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        if (data.welcome_title) setWelcomeTitle(data.welcome_title)
        if (data.welcome_subtitle) setWelcomeSubtitle(data.welcome_subtitle)
        if (data.briefing_version) setBriefingVersion(data.briefing_version)
        if (data.signature_required) setSignatureRequired(data.signature_required === 'true')
      })
      .catch(() => {})
  }, [])

  const loadBriefing = useCallback(async (language: Language, vType: VisitorType, version: string) => {
    try {
      const res = await fetch(`/api/briefing?language=${language}&visitor_type=${vType}&version=${version}`)
      const data = await res.json()
      if (data.content) setBriefingContent(data.content)
    } catch {}
  }, [])

  function handleLanguageSelect(selected: Language) {
    setLang(selected)
    setStep(2)
  }

  function handleVisitorTypeSelect(type: VisitorType) {
    setVisitorType(type)
    loadBriefing(lang, type, briefingVersion)
    setStep(3)
  }

  async function handleBriefingConfirm(signatureData: string | null) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitor_type: visitorType,
          driver_name: formData.name,
          company_name: formData.company,
          license_plate: formData.plate,
          trailer_plate: formData.trailerPlate || null,
          phone: formData.phone || null,
          contact_person: formData.contactPerson || null,
          language: lang,
          briefing_accepted: true,
          briefing_version: briefingVersion,
          has_signature: !!signatureData,
          signature_data: signatureData,
          reference_number: formData.reference || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? translations[lang].error_generic)
        setLoading(false)
        return
      }
      setLoading(false)
      setStep(5)
    } catch {
      setError(translations[lang].error_generic)
      setLoading(false)
    }
  }

  function handleReset() {
    setStep(0)
    setLang('de')
    setVisitorType('truck')
    setFormData(EMPTY_FORM)
    setError('')
  }

  function handleAdminTap() {
    adminTapCount.current += 1
    if (adminTapTimer.current) clearTimeout(adminTapTimer.current)
    adminTapTimer.current = setTimeout(() => { adminTapCount.current = 0 }, 2000)
    if (adminTapCount.current >= 3) {
      adminTapCount.current = 0
      setAdminModalOpen(true)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col overflow-hidden select-none">
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
        <span className="text-white font-bold text-xl tracking-tight shrink-0">GateSign</span>
        {step > 0 && step < 5 && (
          <div className="flex-1 mx-2">
            <ProgressBar step={step} lang={lang} />
          </div>
        )}
        <button onClick={handleAdminTap}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-400 transition-colors shrink-0" aria-label="Admin">
          <Lock className="w-5 h-5" />
        </button>
      </header>

      {error && (
        <div className="mx-6 mt-4 bg-red-900/50 border border-red-700 text-red-200 rounded-xl px-5 py-3 text-lg">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-700 text-xl font-medium">{translations[lang].loading}</p>
          </div>
        </div>
      )}

      {step === 0 && <WelcomeScreen title={welcomeTitle} subtitle={welcomeSubtitle} onStart={() => setStep(1)} />}
      {step === 1 && <LanguageSelect onSelect={handleLanguageSelect} />}
      {step === 2 && <VisitorTypeSelect lang={lang} onSelect={handleVisitorTypeSelect} />}
      {step === 3 && (
        <DriverForm lang={lang} visitorType={visitorType} formData={formData}
          onChange={setFormData} onNext={() => setStep(4)} onBack={() => setStep(2)} />
      )}
      {step === 4 && (
        <SafetyBriefingStep lang={lang} briefingContent={briefingContent}
          signatureRequired={signatureRequired} onConfirm={handleBriefingConfirm} onBack={() => setStep(3)} />
      )}
      {step === 5 && <SuccessScreen lang={lang} onReset={handleReset} />}

      {adminModalOpen && <AdminLoginModal onClose={() => setAdminModalOpen(false)} />}
    </div>
  )
}
