'use client'

import { useState, useEffect, useRef } from 'react'
import { Lock } from 'lucide-react'
import { translations, type Language, type VisitorType } from '@/lib/translations'
import { AdminLoginModal } from '@/components/kiosk/AdminLoginModal'
import { ProgressBar } from '@/components/kiosk/ProgressBar'
import { WelcomeScreen } from '@/components/kiosk/WelcomeScreen'
import { LanguageSelect } from '@/components/kiosk/LanguageSelect'
import { VisitorTypeSelect } from '@/components/kiosk/VisitorTypeSelect'
import { CombinedFormStep, type CheckInFormData } from '@/components/kiosk/CombinedFormStep'
import { SuccessScreen } from '@/components/kiosk/SuccessScreen'

const EMPTY_FORM: CheckInFormData = { name: '', company: '', plate: '', trailerPlate: '', phone: '', reference: '', contactPerson: '' }

export function KioskClient({ slug }: { slug: string }) {
  const [step, setStep] = useState(0)
  const [lang, setLang] = useState<Language>('de')
  const [visitorType, setVisitorType] = useState<VisitorType>('truck')
  const [formData, setFormData] = useState<CheckInFormData>(EMPTY_FORM)
  const [briefingPdfUrl, setBriefingPdfUrl] = useState('')
  const [briefingVersion, setBriefingVersion] = useState('1.0')
  const [signatureRequired, setSignatureRequired] = useState(false)
  const [referenceRequiredTypes, setReferenceRequiredTypes] = useState<string[]>([])
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({})
  const [welcomeTitle, setWelcomeTitle] = useState('Willkommen / Welcome')
  const [welcomeSubtitle, setWelcomeSubtitle] = useState('Bitte melden Sie sich hier an — Please register here')
  const [companyName, setCompanyName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [hoursWeekday, setHoursWeekday] = useState('')
  const [hoursFri, setHoursFri] = useState('')
  const [friClosed, setFriClosed] = useState(true)
  const [hoursSat, setHoursSat] = useState('')
  const [satClosed, setSatClosed] = useState(true)
  const [hoursSun, setHoursSun] = useState('')
  const [sunClosed, setSunClosed] = useState(true)
  const [customHints, setCustomHints] = useState<string[]>([])
  const [customHintsTranslations, setCustomHintsTranslations] = useState<Record<string, string[]>>({})
  const [customHintsTypes, setCustomHintsTypes] = useState<string[][]>([])
  const [activeSafetyRules, setActiveSafetyRules] = useState<string[]>([])
  const [ruleVisitorTypes, setRuleVisitorTypes] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [adminModalOpen, setAdminModalOpen] = useState(false)

  const adminTapCount = useRef(0)
  const adminTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {})
    const noCtx = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', noCtx)
    const noNav = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', noNav)
    history.replaceState({ kiosk: true }, '')
    history.pushState({ kiosk: true }, '')
    const onPopState = () => history.pushState({ kiosk: true }, '')
    window.addEventListener('popstate', onPopState)
    return () => {
      document.removeEventListener('contextmenu', noCtx)
      window.removeEventListener('beforeunload', noNav)
      window.removeEventListener('popstate', onPopState)
    }
  }, [])

  function handleAdminSuccess(targetSlug: string) {
    const exit = document.fullscreenElement
      ? document.exitFullscreen()
      : Promise.resolve()
    exit.catch(() => {}).finally(() => {
      window.location.href = targetSlug ? `/${targetSlug}/admin` : '/'
    })
  }

  useEffect(() => {
    fetch(`/api/settings?slug=${slug}`)
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        if (data.company_name) setCompanyName(data.company_name)
        if (data.logo_url) setLogoUrl(data.logo_url)
        if (data.welcome_title) setWelcomeTitle(data.welcome_title)
        if (data.welcome_subtitle) setWelcomeSubtitle(data.welcome_subtitle)
        if (data.briefing_version) setBriefingVersion(data.briefing_version)
        if (data.signature_required) setSignatureRequired(data.signature_required === 'true')
        if (data.reference_required_types) {
          try { setReferenceRequiredTypes(JSON.parse(data.reference_required_types)) } catch { /* ignore */ }
        }
        if (data.hours_weekday) setHoursWeekday(data.hours_weekday)
        if (data.hours_fri) setHoursFri(data.hours_fri)
        if (data.fri_closed !== undefined) setFriClosed(data.fri_closed !== 'false')
        if (data.hours_sat) setHoursSat(data.hours_sat)
        if (data.sat_closed !== undefined) setSatClosed(data.sat_closed !== 'false')
        if (data.hours_sun) setHoursSun(data.hours_sun)
        if (data.sun_closed !== undefined) setSunClosed(data.sun_closed !== 'false')
        if (data.custom_hints) {
          try { setCustomHints(JSON.parse(data.custom_hints)) } catch { /* ignore */ }
        }
        if (data.custom_hints_translations) {
          try { setCustomHintsTranslations(JSON.parse(data.custom_hints_translations)) } catch { /* ignore */ }
        }
        if (data.custom_hints_types) {
          try { setCustomHintsTypes(JSON.parse(data.custom_hints_types)) } catch { /* ignore */ }
        }
        if (data.active_safety_rules) {
          try { setActiveSafetyRules(JSON.parse(data.active_safety_rules)) } catch { /* ignore */ }
        }
        if (data.rule_visitor_types) {
          try { setRuleVisitorTypes(JSON.parse(data.rule_visitor_types)) } catch { /* ignore */ }
        }
        const isValidUrl = (v: unknown) => typeof v === 'string' && v.startsWith('http')
        const urls: Record<string, string> = {}
        for (const key of ['truck', 'visitor', 'service']) {
          if (isValidUrl(data[`briefing_pdf_${key}`])) urls[key] = data[`briefing_pdf_${key}`]
        }
        setPdfUrls(urls)
      })
      .catch(() => {})
  }, [slug])

  function handleLanguageSelect(selected: Language) {
    setLang(selected)
    setStep(2)
  }

  function handleVisitorTypeSelect(type: VisitorType) {
    setVisitorType(type)
    setBriefingPdfUrl(pdfUrls[type] ?? '')
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
          slug,
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
    <div className="min-h-screen bg-white flex flex-col overflow-hidden select-none">
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-200">
        <button onClick={handleReset} className="text-slate-900 font-bold text-xl tracking-tight shrink-0 hover:text-slate-600 transition-colors">GateSign</button>
        {step > 0 && step < 5 && (
          <div className="flex-1 mx-2">
            <ProgressBar step={step} lang={lang} />
          </div>
        )}
        <button onClick={handleAdminTap}
          className="p-2 rounded-xl text-slate-300 hover:text-slate-400 transition-colors shrink-0" aria-label="Admin">
          <Lock className="w-5 h-5" />
        </button>
      </header>

      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-3 text-lg">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-red-400 hover:text-red-600">✕</button>
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

      {step === 0 && <WelcomeScreen title={welcomeTitle} subtitle={welcomeSubtitle} companyName={companyName} logoUrl={logoUrl} onStart={() => setStep(1)} />}
      {step === 1 && <LanguageSelect onSelect={handleLanguageSelect} onBack={() => setStep(0)} />}
      {step === 2 && (
        <VisitorTypeSelect
          lang={lang}
          onSelect={handleVisitorTypeSelect}
          onBack={() => setStep(1)}
          info={{ hoursWeekday, hoursFri, friClosed, hoursSat, satClosed, hoursSun, sunClosed, customHints: [] }}
        />
      )}
      {step === 3 && (
        <CombinedFormStep lang={lang} visitorType={visitorType} formData={formData}
          onChange={setFormData} pdfUrl={briefingPdfUrl} signatureRequired={signatureRequired}
          referenceRequiredTypes={referenceRequiredTypes}
          activeRules={activeSafetyRules} ruleVisitorTypes={ruleVisitorTypes}
          customHints={customHintsTranslations[lang] ?? customHints} hintTypes={customHintsTypes}
          onConfirm={handleBriefingConfirm} onBack={() => setStep(2)} />
      )}
      {step === 5 && <SuccessScreen lang={lang} onReset={handleReset} />}

      {adminModalOpen && <AdminLoginModal onClose={() => setAdminModalOpen(false)} onSuccess={handleAdminSuccess} />}
    </div>
  )
}
