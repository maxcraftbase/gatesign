'use client'

import { useState, useEffect } from 'react'
import { Save, BookOpen, Plus, X } from 'lucide-react'
import { SAFETY_RULES, SAFETY_RULE_CATEGORIES } from '@/lib/safety-rules'
import { IsoSign } from '@/components/IsoSign'

interface Settings {
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
  custom_hints: string
}

export function AdminSettingsClient() {
  const [settings, setSettings] = useState<Settings>({
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
    custom_hints: '[]',
  })
  const [newHint, setNewHint] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100'
  const labelCls = 'block text-sm font-semibold text-slate-700 mb-1.5'

  const activeRules: string[] = (() => {
    try { return JSON.parse(settings.active_safety_rules) as string[] } catch { return [] }
  })()
  const allRuleIds = SAFETY_RULES.map(r => r.id)
  const allSelected = activeRules.length === allRuleIds.length

  function toggleAllRules() {
    setSettings(s => ({ ...s, active_safety_rules: allSelected ? '[]' : JSON.stringify(allRuleIds) }))
  }

  function DayRow({ label, closedKey, hoursKey }: { label: string; closedKey: keyof Settings; hoursKey: keyof Settings }) {
    const isClosed = settings[closedKey] === 'true'
    return (
      <div>
        <label className={labelCls}>{label}</label>
        <label className="flex items-center gap-3 cursor-pointer mb-2">
          <div
            onClick={() => setSettings(s => ({ ...s, [closedKey]: isClosed ? 'false' : 'true' }))}
            className={`w-12 h-6 rounded-full transition-colors cursor-pointer flex items-center px-1 shrink-0 ${isClosed ? 'bg-red-500' : 'bg-slate-300'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${isClosed ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
          <span className="text-sm font-medium text-slate-700">Geschlossen</span>
        </label>
        {!isClosed && (
          <input className={inputCls} value={settings[hoursKey] as string}
            onChange={e => setSettings(s => ({ ...s, [hoursKey]: e.target.value }))}
            placeholder="z.B. 8:00 – 12:00 Uhr" />
        )}
      </div>
    )
  }

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
          <DayRow label="Freitag" closedKey="fri_closed" hoursKey="hours_fri" />
          <DayRow label="Samstag" closedKey="sat_closed" hoursKey="hours_sat" />
          <DayRow label="Sonntag" closedKey="sun_closed" hoursKey="hours_sun" />
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
        <p className="text-sm text-slate-500 mb-4">Auswählen was gilt — wird automatisch in alle Sprachen übersetzt.</p>
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
                  function toggle() {
                    const next = isActive ? activeRules.filter(id => id !== rule.id) : [...activeRules, rule.id]
                    setSettings(s => ({ ...s, active_safety_rules: JSON.stringify(next) }))
                  }
                  return (
                    <label key={rule.id} onClick={toggle} data-rule-label={rule.label.de}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl border cursor-pointer transition-colors select-none ${
                        isActive ? 'bg-blue-50 border-blue-200' : 'border-slate-200 hover:bg-slate-50'
                      }`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isActive ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                      }`}>
                        {isActive && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                      <IsoSign code={rule.isoCode} icon={rule.icon} signType={rule.signType} size={36} />
                      <span className="text-sm font-medium text-slate-800">{rule.label.de}</span>
                    </label>
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
          Individuelle Sicherheitshinweise — werden im Check-in Terminal angezeigt.
        </p>
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
            <p className="text-sm text-slate-400 italic">Noch keine Hinweise hinzugefügt.</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newHint}
            onChange={e => setNewHint(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHint() } }}
            placeholder="Neuen Hinweis eingeben…"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
          />
          <button type="button" onClick={addHint} disabled={!newHint.trim()}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm">
            <Plus className="w-4 h-4" />
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  )
}
