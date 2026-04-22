'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
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

const DRIVER_TOKEN_KEY = 'gatesign_driver_token'

const UI_TEXT: Record<string, Record<string, string>> = {
  welcome: { de: 'Willkommen', en: 'Welcome', pl: 'Witaj', ro: 'Bun venit', cs: 'Vítejte', hu: 'Üdvözöljük', bg: 'Добре дошли', uk: 'Ласкаво просимо', ru: 'Добро пожаловать', tr: 'Hoş geldiniz' },
  arrive: { de: 'Ankunft bestätigen', en: 'Confirm Arrival', pl: 'Potwierdź przyjazd', ro: 'Confirmați sosirea', cs: 'Potvrdit příjezd', hu: 'Érkezés megerősítése', bg: 'Потвърди пристигане', uk: 'Підтвердити прибуття', ru: 'Подтвердить прибытие', tr: 'Varışı Onayla' },
  readConfirm: { de: 'Ich habe die Sicherheitsbelehrung gelesen und verstanden.', en: 'I have read and understood the safety instructions.', pl: 'Przeczytałem i zrozumiałem instrukcje bezpieczeństwa.', ro: 'Am citit și înțeles instrucțiunile de siguranță.', cs: 'Přečetl jsem bezpečnostní pokyny a porozuměl jim.', hu: 'Elolvastam és megértettem a biztonsági utasításokat.', bg: 'Прочетох и разбрах инструкциите за безопасност.', uk: 'Я прочитав та зрозумів інструкції з безпеки.', ru: 'Я прочитал и понял инструкции по технике безопасности.', tr: 'Güvenlik talimatlarını okudum ve anladım.' },
  confirm: { de: 'Bestätigen & Anmelden', en: 'Confirm & Check In', pl: 'Potwierdź i zamelduj', ro: 'Confirmați și înregistrați', cs: 'Potvrdit a přihlásit', hu: 'Megerősítés és bejelentkezés', bg: 'Потвърди и регистрирай', uk: 'Підтвердити та зареєструватися', ru: 'Подтвердить и зарегистрироваться', tr: 'Onayla ve Giriş Yap' },
  safety: { de: 'Sicherheitsbelehrung', en: 'Safety Instructions', pl: 'Instrukcja bezpieczeństwa', ro: 'Instrucțiuni de siguranță', cs: 'Bezpečnostní pokyny', hu: 'Biztonsági utasítások', bg: 'Инструкции за безопасност', uk: 'Інструкції з безпеки', ru: 'Инструктаж по безопасности', tr: 'Güvenlik Talimatları' },
}

function t(key: keyof typeof UI_TEXT, lang: string): string {
  return UI_TEXT[key]?.[lang] ?? UI_TEXT[key]?.['de'] ?? ''
}

type Step = 'register' | 'briefing' | 'checkin' | 'done'

export function CheckInClient({ site, briefing }: { site: SiteInfo; briefing: BriefingInfo | null }) {
  const [step, setStep] = useState<Step>('checkin')
  const [driver, setDriver] = useState<{ id: string; name: string; license_plate: string; preferred_language: string } | null>(null)
  const [lang, setLang] = useState('de')
  const [loading, setLoading] = useState(true)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [briefingAccepted, setBriefingAccepted] = useState(false)

  // Form state for registration
  const [form, setForm] = useState({ name: '', company_name: '', phone: '', license_plate: '', preferred_language: 'de' })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    async function init() {
      const token = localStorage.getItem(DRIVER_TOKEN_KEY)
      if (!token) { setStep('register'); setLoading(false); return }

      const supabase = createClient()
      const { data: existingDriver } = await supabase
        .from('drivers')
        .select('id, name, license_plate, preferred_language')
        .eq('device_token', token)
        .single()

      if (!existingDriver) { setStep('register'); setLoading(false); return }

      setDriver(existingDriver)
      setLang(existingDriver.preferred_language)

      if (!briefing) { setStep('checkin'); setLoading(false); return }

      // Prüfen ob aktuelle Belehrungsversion schon bestätigt und nicht älter als 12 Monate
      const { data: confirmation } = await supabase
        .from('briefing_confirmations')
        .select('confirmed_at')
        .eq('driver_id', existingDriver.id)
        .eq('site_id', site.id)
        .eq('briefing_version', briefing.version)
        .single()

      if (!confirmation) {
        setStep('briefing')
      } else {
        const confirmedAt = new Date(confirmation.confirmed_at)
        const twelveMonthsAgo = new Date()
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)
        if (confirmedAt < twelveMonthsAgo) {
          setStep('briefing')
        } else {
          setStep('checkin')
        }
      }

      setLoading(false)
    }
    init()
  }, [site.id, briefing])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    const supabase = createClient()
    const token = crypto.randomUUID()

    const { data: newDriver, error } = await supabase
      .from('drivers')
      .insert({ ...form, device_token: token })
      .select('id, name, license_plate, preferred_language')
      .single()

    if (error || !newDriver) { setFormLoading(false); return }

    localStorage.setItem(DRIVER_TOKEN_KEY, token)
    setDriver(newDriver)
    setLang(form.preferred_language)
    setFormLoading(false)

    if (!briefing) { setStep('checkin'); return }
    setStep('briefing')
  }

  async function handleBriefingConfirm() {
    if (!driver || !briefing || !briefingAccepted) return
    setCheckInLoading(true)
    const supabase = createClient()

    await supabase.from('briefing_confirmations').upsert({
      driver_id: driver.id,
      site_id: site.id,
      briefing_id: briefing.id,
      briefing_version: briefing.version,
      language: lang,
    }, { onConflict: 'driver_id,site_id,briefing_version' })

    await doCheckIn(true)
  }

  async function handleCheckIn() {
    await doCheckIn(false)
  }

  async function doCheckIn(_justConfirmedBriefing: boolean) {
    if (!driver || !briefing) return
    setCheckInLoading(true)
    const supabase = createClient()

    await supabase.from('check_ins').insert({
      driver_id: driver.id,
      site_id: site.id,
      briefing_id: briefing.id,
      briefing_version: briefing.version,
      driver_name: driver.name,
      driver_company: '',
      driver_phone: '',
      license_plate: driver.license_plate,
      language: lang,
      briefing_confirmed: true,
      briefing_confirmed_at: new Date().toISOString(),
    })

    setCheckInLoading(false)
    setStep('done')
  }

  const briefingText = briefing?.briefing_translations?.find(t => t.language === lang)?.content
    ?? briefing?.briefing_translations?.[0]?.content
    ?? ''

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    )
  }

  // DONE
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
          </p>
        )}
      </div>
    )
  }

  // REGISTER
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
            <Input label="Kennzeichen" value={form.license_plate} onChange={e => setForm(p => ({ ...p, license_plate: e.target.value.toUpperCase() }))} placeholder="M-AB 1234" required />

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

  // BRIEFING
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

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={briefingAccepted}
              onChange={e => setBriefingAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 rounded accent-slate-900"
            />
            <span className="text-sm text-slate-700">{t('readConfirm', lang)}</span>
          </label>

          <Button
            onClick={handleBriefingConfirm}
            loading={checkInLoading}
            disabled={!briefingAccepted}
            size="xl"
          >
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
            <p className="text-sm text-slate-500">{driver.license_plate}</p>
          </div>
        )}

        <Button onClick={handleCheckIn} loading={checkInLoading} size="xl">
          {t('arrive', lang)}
        </Button>
      </div>
    </div>
  )
}
