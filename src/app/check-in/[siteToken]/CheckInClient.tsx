'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SUPPORTED_LANGUAGES } from '@/types'

interface SiteInfo {
  id: string
  name: string
  companyName: string
}

interface BriefingInfo {
  id: string
  version: number
  briefing_translations: { language: string; content: string }[]
}

interface DriverState {
  id: string
  name: string
  company_name: string
  phone: string
  license_plate: string
  trailer_plate: string | null
  preferred_language: string
}

const DRIVER_TOKEN_KEY = 'gatesign_driver_token'

const UI_TEXT: Record<string, Record<string, string>> = {
  welcome:     { de: 'Willkommen', en: 'Welcome', pl: 'Witaj', ro: 'Bun venit', cs: 'Vítejte', hu: 'Üdvözöljük', bg: 'Добре дошли', uk: 'Ласкаво просимо', ru: 'Добро пожаловать', tr: 'Hoş geldiniz' },
  arrive:      { de: 'Ankunft bestätigen', en: 'Confirm Arrival', pl: 'Potwierdź przyjazd', ro: 'Confirmați sosirea', cs: 'Potvrdit příjezd', hu: 'Érkezés megerősítése', bg: 'Потвърди пристигане', uk: 'Підтвердити прибуття', ru: 'Подтвердить прибытие', tr: 'Varışı Onayla' },
  readConfirm: { de: 'Ich habe die Sicherheitsbelehrung gelesen und verstanden.', en: 'I have read and understood the safety instructions.', pl: 'Przeczytałem i zrozumiałem instrukcje bezpieczeństwa.', ro: 'Am citit și înțeles instrucțiunile de siguranță.', cs: 'Přečetl jsem bezpečnostní pokyny a porozuměl jim.', hu: 'Elolvastam és megértettem a biztonsági utasításokat.', bg: 'Прочетох и разбрах инструкциите за безопасност.', uk: 'Я прочитав та зрозумів інструкції з безпеки.', ru: 'Я прочитал и понял инструкции по технике безопасности.', tr: 'Güvenlik talimatlarını okudum ve anladım.' },
  confirm:     { de: 'Bestätigen & Anmelden', en: 'Confirm & Check In', pl: 'Potwierdź i zamelduj', ro: 'Confirmați și înregistrați', cs: 'Potvrdit a přihlásit', hu: 'Megerősítés és bejelentkezés', bg: 'Потвърди и регистрирай', uk: 'Підтвердити та зареєструватися', ru: 'Подтвердить и зарегистрироваться', tr: 'Onayla ve Giriş Yap' },
  safety:      { de: 'Sicherheitsbelehrung', en: 'Safety Instructions', pl: 'Instrukcja bezpieczeństwa', ro: 'Instrucțiuni de siguranță', cs: 'Bezpečnostní pokyny', hu: 'Biztonsági utasítások', bg: 'Инструкции за безопасност', uk: 'Інструкції з безпеки', ru: 'Инструктаж по безопасности', tr: 'Güvenlik Talimatları' },
  refNum:      { de: 'Referenz-/Lade-Nr. (optional)', en: 'Reference / Load No. (optional)', pl: 'Nr ref./ładunku (opcjonalnie)', ro: 'Nr. referință/încărcare (opțional)', cs: 'Ref./nákladní č. (volitelné)', hu: 'Referencia-/rakszám (opcionális)', bg: 'Рef./товарен №. (незадължително)', uk: 'Реф./вантажний № (необов\'язково)', ru: 'Реф./номер груза (необязательно)', tr: 'Referans/Yük No. (isteğe bağlı)' },
}

function t(key: keyof typeof UI_TEXT, lang: string): string {
  return UI_TEXT[key]?.[lang] ?? UI_TEXT[key]?.['de'] ?? ''
}

type Step = 'register' | 'briefing' | 'checkin' | 'done'

export function CheckInClient({ site, briefing }: { site: SiteInfo; briefing: BriefingInfo | null }) {
  const [step, setStep] = useState<Step>('checkin')
  const [driver, setDriver] = useState<DriverState | null>(null)
  const [lang, setLang] = useState('de')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [briefingAccepted, setBriefingAccepted] = useState(false)
  const [referenceNumber, setReferenceNumber] = useState('')

  const [form, setForm] = useState({
    name: '', company_name: '', phone: '',
    license_plate: '', trailer_plate: '', preferred_language: 'de',
  })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    async function init() {
      const token = localStorage.getItem(DRIVER_TOKEN_KEY)
      if (!token) { setStep('register'); setLoading(false); return }

      const res = await fetch(`/api/check-in/driver?token=${encodeURIComponent(token)}`)
      const existingDriver: DriverState | null = res.ok ? await res.json() : null

      if (!existingDriver) { setStep('register'); setLoading(false); return }

      setDriver(existingDriver)
      setLang(existingDriver.preferred_language)

      if (!briefing) { setStep('checkin'); setLoading(false); return }

      const confRes = await fetch(
        `/api/check-in/confirmation?driverId=${existingDriver.id}&siteId=${site.id}&briefingVersion=${briefing.version}`
      )
      const confirmation: { confirmed_at: string } | null = confRes.ok ? await confRes.json() : null

      if (!confirmation) {
        setStep('briefing')
      } else {
        const confirmedAt = new Date(confirmation.confirmed_at)
        const twelveMonthsAgo = new Date()
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)
        setStep(confirmedAt < twelveMonthsAgo ? 'briefing' : 'checkin')
      }

      setLoading(false)
    }
    init()
  }, [site.id, briefing])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    const token = crypto.randomUUID()

    const res = await fetch('/api/check-in/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, device_token: token }),
    })

    if (!res.ok) { setFormLoading(false); return }
    const newDriver: DriverState = await res.json()

    localStorage.setItem(DRIVER_TOKEN_KEY, token)
    setDriver(newDriver)
    setLang(form.preferred_language)
    setFormLoading(false)
    setStep(briefing ? 'briefing' : 'checkin')
  }

  async function handleBriefingConfirm() {
    if (!driver || !briefing || !briefingAccepted) return
    setActionLoading(true)

    await fetch('/api/check-in/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        driverId: driver.id,
        siteId: site.id,
        briefingId: briefing.id,
        briefingVersion: briefing.version,
        lang,
        driverName: driver.name,
        driverCompany: driver.company_name,
        driverPhone: driver.phone,
        licensePlate: driver.license_plate,
        trailerPlate: driver.trailer_plate,
        referenceNumber: referenceNumber.trim() || null,
        confirmBriefing: true,
      }),
    })

    setActionLoading(false)
    setStep('done')
  }

  async function handleCheckIn() {
    if (!driver || !briefing) return
    setActionLoading(true)

    await fetch('/api/check-in/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        driverId: driver.id,
        siteId: site.id,
        briefingId: briefing.id,
        briefingVersion: briefing.version,
        lang,
        driverName: driver.name,
        driverCompany: driver.company_name,
        driverPhone: driver.phone,
        licensePlate: driver.license_plate,
        trailerPlate: driver.trailer_plate,
        referenceNumber: referenceNumber.trim() || null,
        confirmBriefing: false,
      }),
    })

    setActionLoading(false)
    setStep('done')
  }

  const briefingText = briefing?.briefing_translations?.find(b => b.language === lang)?.content
    ?? briefing?.briefing_translations?.[0]?.content
    ?? ''

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Ankunft erfasst</h1>
        <p className="text-slate-500 text-lg">{site.name}</p>
        <p className="text-slate-400 mt-2">
          {new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
        {driver && (
          <p className="text-slate-500 mt-4 text-sm">
            {driver.name} · {driver.license_plate}
            {driver.trailer_plate && ` · Trailer: ${driver.trailer_plate}`}
          </p>
        )}
        {referenceNumber && (
          <p className="text-slate-400 text-sm mt-1">Ref.: {referenceNumber}</p>
        )}
      </div>
    )
  }

  if (step === 'register') {
    return (
      <div className="min-h-screen bg-white flex flex-col p-6">
        <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
          <div className="text-center pt-6">
            <h1 className="text-xl font-bold text-slate-900">{site.name}</h1>
            <p className="text-slate-500 mt-1 text-sm">Bitte einmalig eintragen</p>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <Input label="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Vor- und Nachname" required />
            <Input label="Firma / Spedition" value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} placeholder="Müller Transport GmbH" required />
            <Input label="Telefon" type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+49 171 ..." required />
            <Input label="Kennzeichen Truck" value={form.license_plate} onChange={e => setForm(p => ({ ...p, license_plate: e.target.value.toUpperCase() }))} placeholder="M-AB 1234" required />
            <Input label="Kennzeichen Trailer (optional)" value={form.trailer_plate} onChange={e => setForm(p => ({ ...p, trailer_plate: e.target.value.toUpperCase() }))} placeholder="M-TR 5678" />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Sprache / Language</label>
              <select
                value={form.preferred_language}
                onChange={e => setForm(p => ({ ...p, preferred_language: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base focus:border-slate-900 outline-none"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            <Button type="submit" loading={formLoading} size="xl" className="mt-2">
              Weiter →
            </Button>
          </form>
        </div>
      </div>
    )
  }

  if (step === 'briefing') {
    return (
      <div className="min-h-screen bg-white flex flex-col p-6">
        <div className="max-w-sm mx-auto w-full flex flex-col gap-4">
          <div className="pt-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{site.name}</p>
            <h1 className="text-xl font-bold text-slate-900">{t('safety', lang)}</h1>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
            {briefingText || 'Keine Belehrung verfügbar.'}
          </div>

          <Input
            label={t('refNum', lang)}
            value={referenceNumber}
            onChange={e => setReferenceNumber(e.target.value)}
            placeholder="z. B. LN-20260422-001"
          />

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={briefingAccepted}
              onChange={e => setBriefingAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 rounded accent-slate-900"
            />
            <span className="text-sm text-slate-700">{t('readConfirm', lang)}</span>
          </label>

          <Button onClick={handleBriefingConfirm} loading={actionLoading} disabled={!briefingAccepted} size="xl">
            {t('confirm', lang)}
          </Button>
        </div>
      </div>
    )
  }

  // CHECK-IN (Wiederkehrender Fahrer)
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full flex flex-col items-center gap-6 text-center">
        <div>
          <p className="text-slate-400 text-sm">{site.companyName}</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{t('welcome', lang)}</h1>
          <p className="text-slate-600 mt-1">{site.name}</p>
        </div>

        {driver && (
          <div className="bg-slate-50 rounded-2xl px-6 py-4 w-full">
            <p className="font-semibold text-slate-900">{driver.name}</p>
            <p className="text-sm text-slate-500">{driver.license_plate}{driver.trailer_plate ? ` · ${driver.trailer_plate}` : ''}</p>
          </div>
        )}

        <div className="w-full">
          <Input
            label={t('refNum', lang)}
            value={referenceNumber}
            onChange={e => setReferenceNumber(e.target.value)}
            placeholder="z. B. LN-20260422-001"
          />
        </div>

        <Button onClick={handleCheckIn} loading={actionLoading} size="xl">
          {t('arrive', lang)}
        </Button>
      </div>
    </div>
  )
}
