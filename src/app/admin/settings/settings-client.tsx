'use client'

import { useState, useEffect, useRef } from 'react'
import { Save, BookOpen, Plus, X, FileText, Trash2, Languages } from 'lucide-react'
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
  hints_pdf_url: string
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
          placeholder="z.B. 8:00 – 12:00 Uhr" />
      )}
    </div>
  )
}

export function AdminSettingsClient() {
  const [settings, setSettings] = useState<Settings>({
    company_name: '',
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
    hints_pdf_url: '',
  })
  const [newHint, setNewHint] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translateSuccess, setTranslateSuccess] = useState(false)
  const [translateError, setTranslateError] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }))
      })
      .catch(() => setError('Fehler beim Laden der Einstellungen.'))
      .finally(() => setLoading(false))
  }, [])

  function getCustomHints(): string[] {
    try { return JSON.parse(settings.custom_hints) as string[] } catch { return [] }
  }

  function addHint() {
    const trimmed = newHint.trim()
    if (!trimmed) return
    setSettings(s => ({ ...s, custom_hints: JSON.stringify([...getCustomHints(), trimmed]) }))
    setNewHint('')
  }

  function removeHint(index: number) {
    setSettings(s => ({ ...s, custom_hints: JSON.stringify(getCustomHints().filter((_, i) => i !== index)) }))
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
              placeholder="z.B. 8:00 – 14:30 Uhr" />
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

      {/* Weitere Hinweise */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Weitere Hinweise</h2>
        <p className="text-sm text-slate-500 mb-5">
          Individuelle Sicherheitshinweise — werden im Check-in Terminal bei der Belehrung angezeigt.
        </p>

        {/* PDF Upload */}
        <div className="mb-5">
          <label className={labelCls}>PDF-Dokument (optional)</label>
          {hintsPdfUrl ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
              <FileText className="w-5 h-5 text-blue-600 shrink-0" />
              <a href={hintsPdfUrl} target="_blank" rel="noreferrer"
                className="flex-1 text-sm text-blue-700 font-medium hover:underline truncate">
                hints.pdf
              </a>
              <button type="button" onClick={handlePdfDelete}
                className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors">
              <FileText className="w-6 h-6 text-slate-400" />
              <span className="text-sm text-slate-500">
                {uploadingPdf ? 'Wird hochgeladen…' : 'PDF hochladen'}
              </span>
              <span className="text-xs text-slate-400">Klicken zum Auswählen</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) void handlePdfUpload(file)
              e.target.value = ''
            }}
          />
        </div>

        {/* Text Hints */}
        <div className="flex flex-col gap-2 mb-4">
          {getCustomHints().map((hint, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="flex-1 text-sm text-slate-800">{hint}</span>
              <button type="button" onClick={() => removeHint(i)}
                className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {getCustomHints().length === 0 && (
            <p className="text-sm text-slate-400 italic">Noch keine Texthinweise hinzugefügt.</p>
          )}
        </div>

        {getCustomHints().length > 0 && (
          <div className="flex items-center gap-3 mb-4">
            <button type="button" onClick={handleTranslate} disabled={translating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors">
              <Languages className="w-4 h-4" />
              {translating ? 'Wird übersetzt…' : 'In alle Sprachen übersetzen'}
            </button>
            {translateSuccess && <span className="text-sm text-emerald-600 font-medium">✓ Übersetzt</span>}
            {translateError && <span className="text-sm text-red-600">{translateError}</span>}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newHint}
            onChange={e => setNewHint(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHint() } }}
            placeholder="Neuen Texthinweis eingeben…"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
          />
          <button type="button" onClick={addHint} disabled={!newHint.trim()}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm">
            <Plus className="w-4 h-4" />
            Hinzufügen
          </button>
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
