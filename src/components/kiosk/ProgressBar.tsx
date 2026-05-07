'use client'

import { translations, type Language } from '@/lib/translations'

export function ProgressBar({ step, lang }: { step: number; lang: Language }) {
  const t = translations[lang]
  const progressStep = step <= 1 ? 1 : step === 2 ? 2 : step === 3 ? 3 : 4
  const steps = [t.step_language, t.step_type, t.step_form, t.step_success]
  return (
    <div className="flex items-center px-1 py-2">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center flex-1 min-w-0">
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              i + 1 < progressStep ? 'bg-emerald-500 text-white' :
              i + 1 === progressStep ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
              'bg-slate-100 text-slate-400'
            }`}>
              {i + 1 < progressStep ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium whitespace-nowrap hidden sm:block transition-colors ${
              i + 1 === progressStep ? 'text-blue-600' :
              i + 1 < progressStep ? 'text-emerald-600' :
              'text-slate-400'
            }`}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 mx-2 mt-[-10px] rounded-full transition-colors ${i + 1 < progressStep ? 'bg-emerald-400' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}
