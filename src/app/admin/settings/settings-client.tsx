'use client'

import { useState, useEffect } from 'react'
import { Save, ChevronDown, ChevronUp } from 'lucide-react'
import { LANGUAGES } from '@/lib/translations'

interface Settings {
  welcome_title: string
  welcome_subtitle: string
  signature_required: string
  site_info: string
  briefing_version: string
}

interface Briefing {
  language: string
  content: string
  version: string
}

export function AdminSettingsClient() {
  const [settings, setSettings] = useState<Settings>({
    welcome_title: 'Willkommen / Welcome',
    welcome_subtitle: 'Bitte melden Sie sich hier an — Please register here',
    signature_required: 'false',
    site_info: '',
    briefing_version: '1.0',
  })
  const [briefings, setBriefings] = useState<Briefing[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [expandedLang, setExpandedLang] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }))
        if (data.briefings) setBriefings(data.briefings)
      })
      .catch(() => setError('Fehler beim Laden der Einstellungen.'))
      .finally(() => setLoading(false))
  }, [])

  function updateBriefing(language: string, content: string) {
    setBriefings(prev => {
      const existing = prev.find(b => b.language === language)
      if (existing) {
        return prev.map(b => b.language === language ? { ...b, content } : b)
      }
      return [...prev, { language, content, version: settings.briefing_version }]
    })
  }

  function getBriefingContent(language: string) {
    return briefings.find(b => b.language === language)?.content ?? ''
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          briefings: briefings.map(b => ({ ...b, version: settings.briefing_version })),
        }),
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
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100'
  const labelCls = 'block text-sm font-semibold text-slate-700 mb-1.5'

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Einstellungen</h1>
          <p className="text-slate-500 text-sm mt-1">Kiosk-Konfiguration und Sicherheitsbelehrungen</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Speichern…' : 'Speichern'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 mb-4 text-sm">
          Erfolgreich gespeichert.
        </div>
      )}

      {/* General settings */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-5">Allgemein</h2>
        <div className="flex flex-col gap-5">
          <div>
            <label className={labelCls}>Willkommenstitel</label>
            <input
              className={inputCls}
              value={settings.welcome_title}
              onChange={e => setSettings(s => ({ ...s, welcome_title: e.target.value }))}
              placeholder="Willkommen / Welcome"
            />
          </div>
          <div>
            <label className={labelCls}>Willkommens-Untertitel</label>
            <input
              className={inputCls}
              value={settings.welcome_subtitle}
              onChange={e => setSettings(s => ({ ...s, welcome_subtitle: e.target.value }))}
              placeholder="Bitte melden Sie sich hier an"
            />
          </div>
          <div>
            <label className={labelCls}>Standortinfo (optional)</label>
            <input
              className={inputCls}
              value={settings.site_info}
              onChange={e => setSettings(s => ({ ...s, site_info: e.target.value }))}
              placeholder="z.B. Lager Nord, Tor 3"
            />
          </div>
          <div>
            <label className={labelCls}>Belehrungsversion</label>
            <input
              className={inputCls}
              value={settings.briefing_version}
              onChange={e => setSettings(s => ({ ...s, briefing_version: e.target.value }))}
              placeholder="1.0"
            />
            <p className="text-xs text-slate-400 mt-1">Ändern Sie die Version, um alle Fahrer die Belehrung erneut bestätigen zu lassen.</p>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setSettings(s => ({ ...s, signature_required: s.signature_required === 'true' ? 'false' : 'true' }))}
                className={`w-12 h-6 rounded-full transition-colors cursor-pointer flex items-center px-1 ${
                  settings.signature_required === 'true' ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  settings.signature_required === 'true' ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </div>
              <span className="text-sm font-medium text-slate-700">Unterschrift erforderlich</span>
            </label>
          </div>
        </div>
      </div>

      {/* Briefing texts per language */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-5">Sicherheitsbelehrungen</h2>
        <p className="text-sm text-slate-500 mb-4">
          Belehrungstexte unterstützen Markdown: **fett**, # Überschrift. Klicken Sie auf eine Sprache zum Bearbeiten.
        </p>
        <div className="flex flex-col gap-3">
          {LANGUAGES.map(lang => (
            <div key={lang.code} className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedLang(expandedLang === lang.code ? null : lang.code)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium text-slate-900">{lang.name}</span>
                  {getBriefingContent(lang.code) && (
                    <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Vorhanden</span>
                  )}
                </div>
                {expandedLang === lang.code ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {expandedLang === lang.code && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  <textarea
                    value={getBriefingContent(lang.code)}
                    onChange={e => updateBriefing(lang.code, e.target.value)}
                    rows={12}
                    className="w-full mt-3 px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 resize-y"
                    placeholder={`Belehrungstext auf ${lang.name}…`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
