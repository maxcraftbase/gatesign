'use client'

import { useState, useEffect, useRef } from 'react'
import { Save, BookOpen, Plus, X, FileText, Trash2, Languages, ChevronDown, ChevronUp } from 'lucide-react'
import { SAFETY_RULES, SAFETY_RULE_CATEGORIES } from '@/lib/safety-rules'
import { IsoSign } from '@/components/IsoSign'

const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100'
const labelCls = 'block text-sm font-semibold text-slate-700 mb-1.5'

const RULE_TYPES = [
  { key: 'all', label: 'Alle' },
  { key: 'truck', label: 'LKW' },
  { key: 'visitor', label: 'Besucher' },
  { key: 'service', label: 'Service' },
] as const

interface Settings {
  company_name: string
  logo_url: string
  welcome_title: string
  welcome_subtitle: string
  signature_required: string
  site_info: string
  hours_weekday: string
  hours_fri: string
  fri_closed: string
  hours_sat: string
  sat_closed: string
  hours_sun: string
  sun_closed: string
  active_safety_rules: string
  rule_visitor_types: string
  custom_hints: string
  custom_hints_types: string
  hints_pdf_url: string
  briefing_pdf_truck: string
  briefing_pdf_visitor: string
  briefing_pdf_service: string
  settings_password: string
  contact_persons: string
}

function DayRow({ label, closedKey, hoursKey, settings, setSettings }: {
  label: string
  closedKey: keyof Settings
  hoursKey: keyof Settings
  settings: Settings
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
}) {
  const isClosed = settings[closedKey] === 'true'
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <label className="flex items-center gap-3 cursor-pointer mb-2">
        <div
          onClick={() => setSettings(s => ({ ...s, [closedKey]: isClosed ? 'false' : 'true' } as Settings))}
          className={`w-12 h-6 rounded-full transition-colors cursor-pointer flex items-center px-1 shrink-0 ${isClosed ? 'bg-red-500' : 'bg-slate-300'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${isClosed ? 'translate-x-6' : 'translate-x-0'}`} />
        </div>
        <span className="text-sm font-medium text-slate-700">Geschlossen</span>
      </label>
      {!isClosed && (
        <input className={inputCls} value={settings[hoursKey] as string}
          onChange={e => setSettings(s => ({ ...s, [hoursKey]: e.target.value } as Settings))}
          onBlur={e => {
            const formatted = e.target.value.trim().replace(
              /^(\d{1,2})(?::(\d{0,2}))?[-–\s]+(\d{1,2})(?::(\d{0,2}))?$/,
              (_, h1, m1 = '00', h2, m2 = '00') =>
                `${h1.padStart(2, '0')}:${m1.padEnd(2, '0')} – ${h2.padStart(2, '0')}:${m2.padEnd(2, '0')}`
            )
            setSettings(s => ({ ...s, [hoursKey]: formatted } as Settings))
          }}
          placeholder="z.B. 08:00 – 17:00" />
      )}
    </div>
  )
}

export function AdminSettingsClient() {
  const [settings, setSettings] = useState<Settings>({
    company_name: '',
    logo_url: '',
    welcome_title: 'Willkommen / Welcome',
    welcome_subtitle: 'Bitte melden Sie sich hier an — Please register here',
    signature_required: 'false',
    site_info: '',
    hours_weekday: '',
    hours_fri: '',
    fri_closed: 'true',
    hours_sat: '',
    sat_closed: 'true',
    hours_sun: '',
    sun_closed: 'true',
    active_safety_rules: '[]',
    rule_visitor_types: '{}',
    custom_hints: '[]',
    custom_hints_types: '[]',
    hints_pdf_url: '',
    briefing_pdf_truck: '',
    briefing_pdf_visitor: '',
    briefing_pdf_service: '',
    settings_password: '',
    contact_persons: '[]',
  })
  const [newHint, setNewHint] = useState('')
  const [newContactPerson, setNewContactPerson] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [uploadingBriefing, setUploadingBriefing] = useState<Record<string, boolean>>({})
  const [translations, setTranslations] = useState<Record<string, string[]>>({})
  const [expandedHint, setExpandedHint] = useState<number | null>(null)
  const [translating, setTranslating] = useState(false)
  const [translateSuccess, setTranslateSuccess] = useState(false)
  const [translateError, setTranslateError] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }))
          if (data.settings.custom_hints_translations) {
            try { setTranslations(JSON.parse(data.settings.custom_hints_translations)) } catch { /* ignore */ }
          }
        }
      })
      .catch(() => setError('Fehler beim Laden der Einstellungen.'))
      .finally(() => setLoading(false))
  }, [])

  function getCustomHints(): string[] {
    try { return JSON.parse(settings.custom_hints) as string[] } catch { return [] }
  }

  function getCustomHintsTypes(): string[][] {
    try { return JSON.parse(settings.custom_hints_types) as string[][] } catch { return [] }
  }

  function addHint() {
    const trimmed = newHint.trim()
    if (!trimmed) return
    setSettings(s => ({
      ...s,
      custom_hints: JSON.stringify([...getCustomHints(), trimmed]),
      custom_hints_types: JSON.stringify([...getCustomHintsTypes(), ['all']]),
    }))
    setNewHint('')
  }

  function removeHint(index: number) {
    setSettings(s => ({
      ...s,
      custom_hints: JSON.stringify(getCustomHints().filter((_, i) => i !== index)),
      custom_hints_types: JSON.stringify(getCustomHintsTypes().filter((_, i) => i !== index)),
    }))
  }

  function toggleHintType(index: number, type: string) {
    const types = getCustomHintsTypes()
    const current = types[index] ?? ['all']
    let next: string[]
    if (type === 'all') {
      next = ['all']
    } else {
      const withoutAll = current.filter(t => t !== 'all')
      if (withoutAll.includes(type)) {
        next = withoutAll.filter(t => t !== type)
        if (next.length === 0) next = ['all']
      } else {
        next = [...withoutAll, type]
      }
    }
    const newTypes = [...types]
    while (newTypes.length <= index) newTypes.push(['all'])
    newTypes[index] = next
    setSettings(s => ({ ...s, custom_hints_types: JSON.stringify(newTypes) }))
  }

  function getContactPersons(): string[] {
    try { return JSON.parse(settings.contact_persons) as string[] } catch { return [] }
  }

  function addContactPerson() {
    const trimmed = newContactPerson.trim()
    if (!trimmed) return
    setSettings(s => ({ ...s, contact_persons: JSON.stringify([...getContactPersons(), trimmed]) }))
    setNewContactPerson('')
  }

  function removeContactPerson(index: number) {
    setSettings(s => ({ ...s, contact_persons: JSON.stringify(getContactPersons().filter((_, i) => i !== index)) }))
  }

  function getRuleVisitorTypes(): Record<string, string[]> {
    try { return JSON.parse(settings.rule_visitor_types) as Record<string, string[]> } catch { return {} }
  }

  function getRuleTypes(ruleId: string): string[] {
    const map = getRuleVisitorTypes()
    return map[ruleId] ?? ['all']
  }

  function toggleRuleType(ruleId: string, type: string) {
    const map = getRuleVisitorTypes()
    const current = map[ruleId] ?? ['all']
    let next: string[]
    if (type === 'all') {
      next = ['all']
    } else {
      const withoutAll = current.filter(t => t !== 'all')
      if (withoutAll.includes(type)) {
        next = withoutAll.filter(t => t !== type)
        if (next.length === 0) next = ['all']
      } else {
        next = [...withoutAll, type]
      }
    }
    setSettings(s => ({ ...s, rule_visitor_types: JSON.stringify({ ...map, [ruleId]: next }) }))
  }

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload-logo', { method: 'POST', body: fd })
    if (res.ok) {
      const data = await res.json() as { url: string }
      setSettings(s => ({ ...s, logo_url: data.url }))
    }
    setUploadingLogo(false)
  }

  async function handleLogoDelete() {
    await fetch('/api/admin/upload-logo', { method: 'DELETE' })
    setSettings(s => ({ ...s, logo_url: '' }))
  }

  async function handleBriefingUpload(file: File, visitorType: string) {
    setUploadingBriefing(s => ({ ...s, [visitorType]: true }))
    const fd = new FormData()
    fd.append('file', file)
    fd.append('visitor_type', visitorType)
    const res = await fetch('/api/admin/upload-briefing', { method: 'POST', body: fd })
    if (res.ok) {
      const data = await res.json() as { url: string }
      setSettings(s => ({ ...s, [`briefing_pdf_${visitorType}`]: data.url }))
    }
    setUploadingBriefing(s => ({ ...s, [visitorType]: false }))
  }

  async function handleBriefingDelete(visitorType: string) {
    await fetch('/api/admin/upload-briefing', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorType }),
    })
    setSettings(s => ({ ...s, [`briefing_pdf_${visitorType}`]: '' }))
  }

  async function handlePdfUpload(file: File) {
    setUploadingPdf(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload-hints-pdf', { method: 'POST', body: fd })
    if (res.ok) {
      const data = await res.json() as { url: string }
      setSettings(s => ({ ...s, hints_pdf_url: data.url }))
    }
    setUploadingPdf(false)
  }

  async function handlePdfDelete() {
    await fetch('/api/admin/upload-hints-pdf', { method: 'DELETE' })
    setSettings(s => ({ ...s, hints_pdf_url: '' }))
  }

  async function handleTranslate() {
    setTranslating(true)
    setTranslateError('')
    setTranslateSuccess(false)
    const res = await fetch('/api/admin/translate-hints', { method: 'POST' })
    if (res.ok) {
      const data = await res.json() as { translations: Record<string, string[]> }
      setTranslations(data.translations)
      setTranslateSuccess(true)
      setTimeout(() => setTranslateSuccess(false), 4000)
    } else {
      const data = await res.json() as { error?: string }
      setTranslateError(data.error ?? 'Fehler beim Übersetzen.')
    }
    setTranslating(false)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, briefings: [] }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Fehler beim Speichern.')
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        if (getCustomHints().length > 0) {
          void handleTranslate()
        }
      }
    } catch {
      setError('Netzwerkfehler.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const activeRules: string[] = (() => {
    try { return JSON.parse(settings.active_safety_rules) as string[] } catch { return [] }
  })()
  const allRuleIds = SAFETY_RULES.map(r => r.id)
  const allSelected = activeRules.length === allRuleIds.length

  function toggleAllRules() {
    setSettings(s => ({ ...s, active_safety_rules: allSelected ? '[]' : JSON.stringify(allRuleIds) }))
  }

  const hintsPdfUrl = settings.hints_pdf_url

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Einstellungen</h1>
          <p className="text-slate-500 text-sm mt-1">Check-in Terminal Konfiguration</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/einrichtung" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm">
            <BookOpen className="w-4 h-4" />
            Einrichtungsanleitung
          </a>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors">
            <Save className="w-4 h-4" />
            {saving ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 mb-4 text-sm">Erfolgreich gespeichert.</div>}

      {/* Allgemein */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-5">Allgemein</h2>
        <div className="flex flex-col gap-5">

          {/* Logo */}
          <div>
            <label className={labelCls}>Logo</label>
            {settings.logo_url ? (
              <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-24 h-16 flex items-center justify-center bg-white rounded-lg border border-slate-200 overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={settings.logo_url} alt="Logo" className="max-w-full max-h-full object-contain p-1" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700 mb-1">Logo hochgeladen</p>
                  <p className="text-xs text-slate-400">Wird im Terminal auf dem Willkommensbildschirm angezeigt.</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button type="button" onClick={() => logoInputRef.current?.click()}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
                    Ersetzen
                  </button>
                  <button type="button" onClick={handleLogoDelete}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                    Löschen
                  </button>
                </div>
              </div>
            ) : (
              <div onClick={() => logoInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 h-32 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all group">
                <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-600 group-hover:text-blue-600 transition-colors">
                    {uploadingLogo ? 'Wird hochgeladen…' : 'Logo hochladen'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, SVG oder WebP — max. 2 MB</p>
                </div>
              </div>
            )}
            <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) void handleLogoUpload(file)
                e.target.value = ''
              }} />
          </div>

          <div>
            <label className={labelCls}>Firmenname</label>
            <input className={inputCls} value={settings.company_name}
              onChange={e => setSettings(s => ({ ...s, company_name: e.target.value }))}
              placeholder="z.B. Muster Logistik GmbH" />
            <p className="text-xs text-slate-400 mt-1">Wird im Terminal über dem Willkommenstitel angezeigt.</p>
          </div>
          <div>
            <label className={labelCls}>Willkommenstitel</label>
            <input className={inputCls} value={settings.welcome_title}
              onChange={e => setSettings(s => ({ ...s, welcome_title: e.target.value }))}
              placeholder="Willkommen / Welcome" />
          </div>
          <div>
            <label className={labelCls}>Willkommens-Untertitel</label>
            <input className={inputCls} value={settings.welcome_subtitle}
              onChange={e => setSettings(s => ({ ...s, welcome_subtitle: e.target.value }))}
              placeholder="Bitte melden Sie sich hier an" />
          </div>
          <div>
            <label className={labelCls}>Standortinfo (optional)</label>
            <input className={inputCls} value={settings.site_info}
              onChange={e => setSettings(s => ({ ...s, site_info: e.target.value }))}
              placeholder="z.B. Lager Nord, Tor 3" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setSettings(s => ({ ...s, signature_required: s.signature_required === 'true' ? 'false' : 'true' }))}
              className={`w-12 h-6 rounded-full transition-colors cursor-pointer flex items-center px-1 ${settings.signature_required === 'true' ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.signature_required === 'true' ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm font-medium text-slate-700">Unterschrift erforderlich</span>
          </label>
        </div>
      </div>

      {/* Betriebszeiten */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Betriebszeiten</h2>
        <p className="text-sm text-slate-500 mb-5">Wird im Check-in Terminal angezeigt — automatisch übersetzt.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Mo – Do</label>
            <input className={inputCls} value={settings.hours_weekday}
              onChange={e => setSettings(s => ({ ...s, hours_weekday: e.target.value }))}
              onBlur={e => {
                const formatted = e.target.value.trim().replace(
                  /^(\d{1,2})(?::(\d{0,2}))?[-–\s]+(\d{1,2})(?::(\d{0,2}))?$/,
                  (_, h1, m1 = '00', h2, m2 = '00') =>
                    `${h1.padStart(2, '0')}:${m1.padEnd(2, '0')} – ${h2.padStart(2, '0')}:${m2.padEnd(2, '0')}`
                )
                setSettings(s => ({ ...s, hours_weekday: formatted }))
              }}
              placeholder="z.B. 08:00 – 17:00" />
            <p className="text-xs text-slate-400 mt-1">Leer lassen = nicht anzeigen</p>
          </div>
          <DayRow label="Freitag" closedKey="fri_closed" hoursKey="hours_fri" settings={settings} setSettings={setSettings} />
          <DayRow label="Samstag" closedKey="sat_closed" hoursKey="hours_sat" settings={settings} setSettings={setSettings} />
          <DayRow label="Sonntag" closedKey="sun_closed" hoursKey="hours_sun" settings={settings} setSettings={setSettings} />
        </div>
      </div>

      {/* Sicherheitsregeln */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-slate-900">Sicherheitsregeln</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{activeRules.length} aktiv</span>
            <button type="button" onClick={toggleAllRules}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
              {allSelected ? 'Alle abwählen' : 'Alle auswählen'}
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-1">Auswählen was gilt — wird automatisch in alle Sprachen übersetzt.</p>
        <p className="text-xs text-slate-400 mb-4">Für aktive Regeln: Typ-Chips auswählen, für welche Besucher die Regel gilt.</p>
        <input
          type="text"
          placeholder="Regeln suchen…"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 mb-5"
          onChange={e => {
            const q = e.target.value.toLowerCase()
            document.querySelectorAll<HTMLElement>('[data-rule-label]').forEach(el => {
              el.style.display = el.dataset.ruleLabel?.toLowerCase().includes(q) ? '' : 'none'
            })
            document.querySelectorAll<HTMLElement>('[data-rule-category]').forEach(el => {
              const visible = [...el.querySelectorAll<HTMLElement>('[data-rule-label]')].some(r => r.style.display !== 'none')
              el.style.display = visible ? '' : 'none'
            })
          }}
        />
        {(['ppe', 'prohibition', 'behavior', 'vehicle', 'emergency', 'legal'] as const).map(cat => {
          const rulesInCat = SAFETY_RULES.filter(r => r.category === cat)
          return (
            <div key={cat} className="mb-5" data-rule-category={cat}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{SAFETY_RULE_CATEGORIES[cat].de}</p>
              <div className="flex flex-col gap-2">
                {rulesInCat.map(rule => {
                  const isActive = activeRules.includes(rule.id)
                  const ruleTypes = getRuleTypes(rule.id)
                  function toggle() {
                    const next = isActive ? activeRules.filter(id => id !== rule.id) : [...activeRules, rule.id]
                    setSettings(s => ({ ...s, active_safety_rules: JSON.stringify(next) }))
                  }
                  return (
                    <div key={rule.id} data-rule-label={rule.label.de}
                      className={`rounded-xl border transition-colors ${isActive ? 'bg-blue-50 border-blue-200' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <label onClick={toggle}
                        className="flex items-center gap-4 px-4 py-3 cursor-pointer select-none">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isActive ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                        }`}>
                          {isActive && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                        <IsoSign code={rule.isoCode} icon={rule.icon} signType={rule.signType} size={36} />
                        <span className="text-sm font-medium text-slate-800 flex-1">{rule.label.de}</span>
                      </label>
                      {isActive && (
                        <div className="flex items-center gap-1.5 px-4 pb-3">
                          <span className="text-xs text-slate-400 mr-1">Gilt für:</span>
                          {RULE_TYPES.map(({ key, label }) => {
                            const selected = ruleTypes.includes(key)
                            return (
                              <button key={key} type="button"
                                onClick={() => toggleRuleType(rule.id, key)}
                                className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
                                  selected
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600'
                                }`}>
                                {label}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Texthinweise */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Texthinweise</h2>
        <p className="text-sm text-slate-500 mb-5">
          Individuelle Hinweise — werden im Terminal bei der Belehrung angezeigt und automatisch übersetzt.
        </p>

        {translateSuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-2.5 mb-4 text-sm flex items-center gap-2"><Languages className="w-4 h-4" /> Automatisch in alle Sprachen übersetzt.</div>}
        {translateError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 mb-4 text-sm">{translateError}</div>}

        <div className="flex flex-col gap-2 mb-4">
          {getCustomHints().map((hint, i) => {
            const hasTranslation = Object.keys(translations).length > 0
            const isExpanded = expandedHint === i
            const LANG_LABELS: Record<string, string> = {
              de: '🇩🇪 DE', en: '🇬🇧 EN', pl: '🇵🇱 PL', ro: '🇷🇴 RO',
              cs: '🇨🇿 CS', hu: '🇭🇺 HU', bg: '🇧🇬 BG', uk: '🇺🇦 UK',
              ru: '🇷🇺 RU', tr: '🇹🇷 TR',
            }
            return (
              <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50">
                  <span className="flex-1 text-sm text-slate-800 min-w-0">{hint}</span>
                  {hasTranslation && (
                    <button type="button"
                      onClick={() => setExpandedHint(isExpanded ? null : i)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors shrink-0">
                      <Languages className="w-3.5 h-3.5" />
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <button type="button" onClick={() => removeHint(i)}
                    className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 px-4 pb-2.5 border-b border-slate-100">
                  <span className="text-xs text-slate-400 mr-1">Gilt für:</span>
                  {RULE_TYPES.map(({ key, label }) => {
                    const hintTypesArr = getCustomHintsTypes()
                    const currentTypes = hintTypesArr[i] ?? ['all']
                    const selected = currentTypes.includes(key)
                    return (
                      <button key={key} type="button"
                        onClick={() => toggleHintType(i, key)}
                        className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
                          selected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600'
                        }`}>
                        {label}
                      </button>
                    )
                  })}
                </div>
                {isExpanded && (
                  <div className="border-t border-slate-200 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-1.5 bg-white">
                    {Object.entries(LANG_LABELS).map(([lang, lbl]) => (
                      <div key={lang} className="flex items-start gap-2 text-xs">
                        <span className="text-slate-400 font-medium shrink-0 w-10">{lbl}</span>
                        <span className="text-slate-700">{translations[lang]?.[i] ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {getCustomHints().length === 0 && (
            <p className="text-sm text-slate-400 italic">Noch keine Hinweise hinzugefügt.</p>
          )}
        </div>

        <div className="flex gap-2">
          <input type="text" value={newHint} onChange={e => setNewHint(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHint() } }}
            placeholder="Neuen Hinweis eingeben…"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100" />
          <button type="button" onClick={addHint} disabled={!newHint.trim()}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm">
            <Plus className="w-4 h-4" />
            Hinzufügen
          </button>
        </div>
      </div>

      {/* Hinweisdokumente */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Hinweisdokumente</h2>
        <p className="text-sm text-slate-500 mb-5">
          Je Besuchertyp ein PDF — wird im Terminal während der Belehrung angezeigt.
        </p>
        <div className="flex flex-col gap-4">
          {([['truck', 'LKW'], ['visitor', 'Besucher'], ['service', 'Dienstleister']] as const).map(([type, label]) => {
            const key = `briefing_pdf_${type}` as keyof Settings
            const url = settings[key] as string
            const uploading = uploadingBriefing[type] ?? false
            const inputId = `briefing-input-${type}`
            return (
              <div key={type}>
                <p className="text-sm font-semibold text-slate-700 mb-2">{label}</p>
                {url ? (
                  <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                    <a href={url} target="_blank" rel="noreferrer"
                      className="flex-1 text-sm text-blue-700 font-medium hover:underline truncate">
                      briefing_{type}.pdf
                    </a>
                    <button type="button" onClick={() => void handleBriefingDelete(type)}
                      className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label htmlFor={inputId}
                    className="flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors">
                    <FileText className="w-6 h-6 text-slate-400" />
                    <span className="text-sm text-slate-500">{uploading ? 'Wird hochgeladen…' : 'PDF hochladen'}</span>
                  </label>
                )}
                <input id={inputId} type="file" accept="application/pdf" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) void handleBriefingUpload(f, type); e.target.value = '' }} />
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end pb-8">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors">
          <Save className="w-4 h-4" />
          {saving ? 'Speichern…' : 'Speichern'}
        </button>
      </div>
    </div>
  )
}
