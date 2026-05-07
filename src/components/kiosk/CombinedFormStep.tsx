'use client'

import { useState, useRef, useCallback } from 'react'
import { translations, type Language, type VisitorType } from '@/lib/translations'
import { SAFETY_RULES } from '@/lib/safety-rules'
import { SignaturePad, type SignaturePadHandle } from '@/components/kiosk/SignaturePad'
import { IsoSign } from '@/components/IsoSign'

export interface CheckInFormData {
  name: string
  company: string
  plate: string
  trailerPlate: string
  phone: string
  reference: string
  contactPerson: string
}

export function CombinedFormStep({
  lang,
  visitorType,
  formData,
  onChange,
  pdfUrl,
  signatureRequired,
  referenceRequiredTypes,
  activeRules,
  ruleVisitorTypes,
  customHints,
  hintTypes,
  onConfirm,
  onBack,
}: {
  lang: Language
  visitorType: VisitorType
  formData: CheckInFormData
  onChange: (f: CheckInFormData) => void
  pdfUrl: string
  signatureRequired: boolean
  referenceRequiredTypes: string[]
  activeRules: string[]
  ruleVisitorTypes: Record<string, string[]>
  customHints: string[]
  hintTypes: string[][]
  onConfirm: (signatureData: string | null) => void
  onBack: () => void
}) {
  const t = translations[lang]
  const [error, setError] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [hasSigned, setHasSigned] = useState(false)
  const sigPadRef = useRef<SignaturePadHandle>(null)
  const handleSign = useCallback(() => setHasSigned(true), [])

  const referenceRequired = referenceRequiredTypes.includes(visitorType)

  function handleConfirm() {
    if (!formData.name.trim() || !formData.company.trim() || !formData.plate.trim()) {
      setError(t.required_fields)
      return
    }
    if (referenceRequired && !formData.reference.trim()) {
      setError(t.required_fields)
      return
    }
    if (!accepted) return
    if (signatureRequired && !hasSigned) return
    setError('')
    const sigData = hasSigned ? sigPadRef.current?.toDataURL() ?? null : null
    onConfirm(sigData)
  }

  function handleClearSig() {
    sigPadRef.current?.clear()
    setHasSigned(false)
  }

  const canConfirm = accepted && (!signatureRequired || hasSigned)

  const inputCls = 'w-full px-5 py-4 rounded-xl border border-slate-200 text-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors placeholder:text-slate-400'
  const labelCls = 'text-lg font-semibold text-slate-700 mb-1 block'

  return (
    <div className="flex flex-col flex-1 px-6 py-2 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6 max-w-2xl mx-auto w-full mb-4">
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
          {(visitorType === 'truck' || referenceRequired) && (
            <div>
              <label className={labelCls}>
                {t.field_reference}
                {referenceRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
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

      <div className="bg-white rounded-2xl shadow-sm p-6 max-w-2xl mx-auto w-full mb-4">
        <h2 className="text-3xl font-bold text-slate-900 mb-5">{t.briefing_title}</h2>

        {(() => {
          const visibleRules = SAFETY_RULES.filter(r => {
            if (!activeRules.includes(r.id)) return false
            const types = ruleVisitorTypes[r.id] ?? ['all']
            return types.includes('all') || types.includes(visitorType)
          })
          return visibleRules.length > 0 ? (
            <div className="flex flex-col gap-2 mb-6">
              {visibleRules.map(rule => (
                <div key={rule.id} className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <IsoSign code={rule.isoCode} icon={rule.icon} signType={rule.signType} size={44} />
                  <span className="text-base font-medium text-slate-800">{rule.label[lang]}</span>
                </div>
              ))}
            </div>
          ) : null
        })()}

        {customHints.length > 0 && (
          <div className="flex flex-col gap-2 mb-6">
            {customHints.map((hint, i) => {
              const types = hintTypes[i] ?? ['all']
              if (!types.includes('all') && !types.includes(visitorType)) return null
              return (
                <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <IsoSign code="W001" icon="⚠️" signType="warning" size={36} />
                  <span className="text-base text-slate-800">{hint}</span>
                </div>
              )
            })}
          </div>
        )}

        {pdfUrl ? (
          <div className="mb-6 overflow-hidden rounded-xl" style={{ height: '75vh' }}>
            <iframe src={pdfUrl} className="w-full h-full block" style={{ border: 'none', touchAction: 'pan-y' }} title="Safety Briefing" />
          </div>
        ) : activeRules.length === 0 && customHints.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 mb-6 flex items-center justify-center" style={{ height: '20vh' }}>
            <p className="text-slate-400 text-lg">Keine Belehrung hinterlegt.</p>
          </div>
        ) : null}

        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-lg font-semibold text-slate-700">{t.signature_title}</label>
            <button type="button" onClick={handleClearSig}
              className="text-sm text-slate-500 hover:text-red-500 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors">
              {t.signature_clear}
            </button>
          </div>
          <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden relative">
            <SignaturePad ref={sigPadRef} className="w-full h-36 block" onSign={handleSign} />
            {!hasSigned && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-slate-400 text-base">
                  {lang === 'de' ? 'Hier unterschreiben' : 'Sign here'}
                </span>
              </div>
            )}
          </div>
        </div>

        <label className="flex items-start gap-4 cursor-pointer select-none">
          <div onClick={() => setAccepted(!accepted)}
            className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
              accepted ? 'bg-blue-600 border-blue-600' : 'border-slate-300 hover:border-blue-400'
            }`}>
            {accepted && <span className="text-white text-lg font-bold">✓</span>}
          </div>
          <span onClick={() => setAccepted(!accepted)} className="text-lg text-slate-700 leading-relaxed">
            {t.briefing_accept_label}
          </span>
        </label>
      </div>

      <div className="flex gap-4 mt-2 max-w-2xl mx-auto w-full pb-4">
        <button onClick={onBack}
          className="flex-1 py-5 text-xl font-semibold rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 transition-all">
          {t.btn_back}
        </button>
        <button onClick={handleConfirm} disabled={!canConfirm}
          className="flex-grow-[2] py-5 text-xl font-semibold rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all">
          {t.btn_confirm}
        </button>
      </div>
    </div>
  )
}
