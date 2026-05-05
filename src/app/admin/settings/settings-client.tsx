'use client'

import { useState, useEffect, useRef } from 'react'
import { Save, ChevronDown, ChevronUp, Upload, FileText, Loader2, CheckCircle2, ExternalLink, Trash2, BookOpen } from 'lucide-react'
import { LANGUAGES, VISITOR_TYPES } from '@/lib/translations'
import { SAFETY_RULES, SAFETY_RULE_CATEGORIES, SIGN_STYLES } from '@/lib/safety-rules'

interface Settings {
  welcome_title: string
  welcome_subtitle: string
  signature_required: string
  site_info: string
  briefing_version: string
  hours_weekday: string
  hours_fri: string
  fri_closed: string
  show_hint_refnr: string
  show_hint_docs: string
  active_safety_rules: string
}

interface Briefing {
  language: string
  visitor_type: string
  content: string
  version: string
}

const VISITOR_TYPE_LABELS: Record<string, string> = {
  truck: 'LKW-Fahrer',
  visitor: 'Besucher',
  service: 'Dienstleister',
}

export function AdminSettingsClient() {
  const [settings, setSettings] = useState<Settings>({
    welcome_title: 'Willkommen / Welcome',
    welcome_subtitle: 'Bitte melden Sie sich hier an — Please register here',
    signature_required: 'false',
    site_info: '',
    briefing_version: '1.0',
    hours_weekday: '',
    hours_fri: '',
    fri_closed: 'true',
    show_hint_refnr: 'false',
    show_hint_docs: 'false',
    active_safety_rules: '[]',
  })
  const [briefings, setBriefings] = useState<Briefing[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [expandedLang, setExpandedLang] = useState<string | null>(null)
  const [activeVisitorType, setActiveVisitorType] = useState<string>('truck')

  // PDF upload state
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const [pdfUploadType, setPdfUploadType] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({})
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }))
          const urls: Record<string, string> = {}
          for (const key of ['truck', 'visitor', 'service']) {
            if (data.settings[`briefing_pdf_${key}`]) urls[key] = data.settings[`briefing_pdf_${key}`]
          }
          setPdfUrls(urls)
        }
        if (data.briefings) setBriefings(data.briefings)
      })
      .catch(() => setError('Fehler beim Laden der Einstellungen.'))
      .finally(() => setLoading(false))
  }, [])

  function updateBriefing(language: string, visitor_type: string, content: string) {
    setBriefings(prev => {
      const existing = prev.find(b => b.language === language && b.visitor_type === visitor_type)
      if (existing) {
        return prev.map(b =>
          b.language === language && b.visitor_type === visitor_type ? { ...b, content } : b
        )
      }
      return [...prev, { language, visitor_type, content, version: settings.briefing_version }]
    })
  }

  function getBriefingContent(language: string, visitor_type: string) {
    return briefings.find(b => b.language === language && b.visitor_type === visitor_type)?.content ?? ''
  }

  function hasBriefingsForType(visitor_type: string) {
    return briefings.some(b => b.visitor_type === visitor_type && b.content.trim())
  }

  function triggerPdfUpload(visitor_type: string) {
    setPdfUploadType(visitor_type)
    pdfInputRef.current?.click()
  }

  async function handlePdfRemove(visitorType: string) {
    setRemoving(visitorType)
    setUploadError('')
    try {
      const res = await fetch('/api/admin/upload-briefing', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorType }),
      })
      if (!res.ok) {
        const data = await res.json()
        setUploadError(data.error ?? 'Fehler beim Entfernen.')
      } else {
        setPdfUrls(prev => { const next = { ...prev }; delete next[visitorType]; return next })
      }
    } catch {
      setUploadError('Netzwerkfehler beim Entfernen.')
    } finally {
      setRemoving(null)
    }
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !pdfUploadType) return
    e.target.value = ''

    const vt = pdfUploadType
    setPdfUploadType(null)
    setUploading(vt)
    setUploadError('')
    setUploadSuccess(null)

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('visitor_type', vt)
      form.append('version', settings.briefing_version)

      const res = await fetch('/api/admin/upload-briefing', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) {
        setUploadError(data.error ?? 'Fehler beim Upload.')
      } else {
        setUploadSuccess(vt)
        setPdfUrls(prev => ({ ...prev, [vt]: data.url }))
        setTimeout(() => setUploadSuccess(null), 4000)
      }
    } catch {
      setUploadError('Netzwerkfehler beim Upload.')
    } finally {
      setUploading(null)
    }
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
          <p className="text-slate-500 text-sm mt-1">Check-in Terminal Konfiguration und Sicherheitsbelehrungen</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/einrichtung"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm"
          >
            <BookOpen className="w-4 h-4" />
            Einrichtungsanleitung
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>
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
          <div>
            <label className={labelCls}>Belehrungsversion</label>
            <input className={inputCls} value={settings.briefing_version}
              onChange={e => setSettings(s => ({ ...s, briefing_version: e.target.value }))}
              placeholder="1.0" />
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

      {/* Operating hours & hints */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Betriebszeiten & Hinweise</h2>
        <p className="text-sm text-slate-500 mb-5">
          Wird im Check-in Terminal unter der Besuchertypauswahl angezeigt — automatisch in alle Sprachen übersetzt.
        </p>
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Mo – Do (Zeiten)</label>
              <input
                className={inputCls}
                value={settings.hours_weekday}
                onChange={e => setSettings(s => ({ ...s, hours_weekday: e.target.value }))}
                placeholder="z.B. 8:00 – 14:30 Uhr"
              />
              <p className="text-xs text-slate-400 mt-1">Leer lassen = nicht anzeigen</p>
            </div>
            <div>
              <label className={labelCls}>Freitag</label>
              <label className="flex items-center gap-3 cursor-pointer mb-2">
                <div
                  onClick={() => setSettings(s => ({ ...s, fri_closed: s.fri_closed === 'true' ? 'false' : 'true' }))}
                  className={`w-12 h-6 rounded-full transition-colors cursor-pointer flex items-center px-1 shrink-0 ${
                    settings.fri_closed === 'true' ? 'bg-red-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    settings.fri_closed === 'true' ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </div>
                <span className="text-sm font-medium text-slate-700">Geschlossen</span>
              </label>
              {settings.fri_closed !== 'true' && (
                <input
                  className={inputCls}
                  value={settings.hours_fri}
                  onChange={e => setSettings(s => ({ ...s, hours_fri: e.target.value }))}
                  placeholder="z.B. 8:00 – 12:00 Uhr"
                />
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setSettings(s => ({ ...s, show_hint_refnr: s.show_hint_refnr === 'true' ? 'false' : 'true' }))}
                className={`w-12 h-6 rounded-full transition-colors cursor-pointer flex items-center px-1 shrink-0 ${
                  settings.show_hint_refnr === 'true' ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  settings.show_hint_refnr === 'true' ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </div>
              <span className="text-sm font-medium text-slate-700">⚠️ &quot;Referenznummer bereit halten&quot; anzeigen</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setSettings(s => ({ ...s, show_hint_docs: s.show_hint_docs === 'true' ? 'false' : 'true' }))}
                className={`w-12 h-6 rounded-full transition-colors cursor-pointer flex items-center px-1 shrink-0 ${
                  settings.show_hint_docs === 'true' ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  settings.show_hint_docs === 'true' ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </div>
              <span className="text-sm font-medium text-slate-700">📄 &quot;Fahrzeugpapiere bereit halten&quot; anzeigen</span>
            </label>
          </div>
        </div>
      </div>

      {/* Safety rules library */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-slate-900">Sicherheitsregeln</h2>
          <span className="text-xs text-slate-400">
            {(() => { try { return (JSON.parse(settings.active_safety_rules) as string[]).length } catch { return 0 } })()} aktiv
          </span>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Auswählen was gilt — wird automatisch in alle Sprachen übersetzt und im Check-in Terminal angezeigt.
        </p>
        <input
          type="text"
          placeholder="Regeln suchen…"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 mb-5"
          id="safety-rule-search"
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
                  const active = (() => {
                    try { return (JSON.parse(settings.active_safety_rules) as string[]).includes(rule.id) }
                    catch { return false }
                  })()
                  function toggle() {
                    const current: string[] = (() => {
                      try { return JSON.parse(settings.active_safety_rules) as string[] }
                      catch { return [] }
                    })()
                    const next = active ? current.filter(id => id !== rule.id) : [...current, rule.id]
                    setSettings(s => ({ ...s, active_safety_rules: JSON.stringify(next) }))
                  }
                  return (
                    <label key={rule.id} onClick={toggle} data-rule-label={rule.label.de}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl border cursor-pointer transition-colors select-none ${
                        active ? 'bg-blue-50 border-blue-200' : 'border-slate-200 hover:bg-slate-50'
                      }`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        active ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                      }`}>
                        {active && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                      <div className={`w-9 h-9 flex items-center justify-center text-lg shrink-0 ${SIGN_STYLES[rule.signType].bg} ${SIGN_STYLES[rule.signType].shape}`}>
                        {rule.icon}
                      </div>
                      <span className="text-sm font-medium text-slate-800">{rule.label.de}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* PDF Upload per visitor type */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Sicherheitsbelehrung hochladen</h2>
        <p className="text-sm text-slate-500 mb-5">
          PDF hochladen — wird direkt im Check-in Terminal angezeigt.
        </p>

        {uploadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{uploadError}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {VISITOR_TYPES.map(vt => {
            const isUploading = uploading === vt.type
            const isRemoving = removing === vt.type
            const isSuccess = uploadSuccess === vt.type
            const hasPdf = !!pdfUrls[vt.type]

            return (
              <div key={vt.type} className="border border-slate-200 rounded-2xl p-5 flex flex-col items-center gap-3">
                <span className="text-4xl">{vt.icon}</span>
                <span className="font-semibold text-slate-900">{VISITOR_TYPE_LABELS[vt.type]}</span>

                {isSuccess ? (
                  <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Gespeichert
                  </span>
                ) : hasPdf ? (
                  <a href={pdfUrls[vt.type]} target="_blank" rel="noreferrer"
                    className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-emerald-100 transition-colors">
                    <FileText className="w-3 h-3" /> PDF anzeigen <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">Kein PDF hinterlegt</span>
                )}

                <button
                  type="button"
                  onClick={() => triggerPdfUpload(vt.type)}
                  disabled={isUploading || isRemoving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-900 transition-colors disabled:opacity-50"
                >
                  {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Hochladen…</> : <><Upload className="w-4 h-4" />{hasPdf ? 'PDF ersetzen' : 'PDF hochladen'}</>}
                </button>

                {hasPdf && (
                  <button
                    type="button"
                    onClick={() => handlePdfRemove(vt.type)}
                    disabled={isRemoving || isUploading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-100 text-sm font-medium text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
                  >
                    {isRemoving ? <><Loader2 className="w-4 h-4 animate-spin" /> Entfernen…</> : <><Trash2 className="w-4 h-4" /> PDF entfernen</>}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Manual briefing editing per language */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Belehrungstexte bearbeiten</h2>
        <p className="text-sm text-slate-500 mb-4">
          Hier können einzelne Übersetzungen manuell angepasst werden.
        </p>

        <div className="flex gap-2 mb-4">
          {VISITOR_TYPES.map(vt => (
            <button
              key={vt.type}
              type="button"
              onClick={() => { setActiveVisitorType(vt.type); setExpandedLang(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeVisitorType === vt.type ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{vt.icon}</span>
              <span>{VISITOR_TYPE_LABELS[vt.type]}</span>
            </button>
          ))}
        </div>

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
                  {getBriefingContent(lang.code, activeVisitorType) && (
                    <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Vorhanden</span>
                  )}
                </div>
                {expandedLang === lang.code
                  ? <ChevronUp className="w-4 h-4 text-slate-400" />
                  : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {expandedLang === lang.code && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  <textarea
                    value={getBriefingContent(lang.code, activeVisitorType)}
                    onChange={e => updateBriefing(lang.code, activeVisitorType, e.target.value)}
                    rows={10}
                    className="w-full mt-3 px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 resize-y"
                    placeholder={`Belehrungstext auf ${lang.name}…`}
                  />
                  <p className="text-xs text-slate-400 mt-1">Nach Änderungen oben auf &quot;Speichern&quot; klicken.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hidden PDF input */}
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handlePdfUpload}
      />
    </div>
  )
}
