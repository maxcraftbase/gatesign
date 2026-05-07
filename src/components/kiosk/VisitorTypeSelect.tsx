'use client'

import { translations, VISITOR_TYPES, type Language, type VisitorType } from '@/lib/translations'

export interface InfoPanelProps {
  hoursWeekday: string
  hoursFri: string
  friClosed: boolean
  hoursSat: string
  satClosed: boolean
  hoursSun: string
  sunClosed: boolean
  customHints: string[]
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  truck: (
    <svg viewBox="0 0 64 64" fill="none" className="w-14 h-14" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="18" width="36" height="26" rx="3" className="stroke-slate-700" fill="none"/>
      <path d="M38 28h14l8 10v8H38V28z" className="stroke-slate-700" fill="none"/>
      <circle cx="14" cy="48" r="5" className="stroke-slate-700" fill="none"/>
      <circle cx="48" cy="48" r="5" className="stroke-slate-700" fill="none"/>
      <line x1="19" y1="48" x2="43" y2="48" className="stroke-slate-700"/>
    </svg>
  ),
  visitor: (
    <svg viewBox="0 0 64 64" fill="none" className="w-14 h-14" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="18" r="10" className="stroke-slate-700" fill="none"/>
      <path d="M8 56c0-13.255 10.745-24 24-24s24 10.745 24 24" className="stroke-slate-700" fill="none"/>
    </svg>
  ),
  service: (
    <svg viewBox="0 0 24 24" fill="none" className="w-14 h-14" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="#334155"/>
    </svg>
  ),
}

export function VisitorTypeSelect({ lang, onSelect, onBack, info }: {
  lang: Language
  onSelect: (t: VisitorType) => void
  onBack: () => void
  info: InfoPanelProps
}) {
  const t = translations[lang]
  const hasHours = !!info.hoursWeekday

  return (
    <div className="flex flex-col flex-1 px-6 py-4">
      <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">{t.choose_type}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto w-full">
        {VISITOR_TYPES.map(({ type, labelKey }) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="flex flex-col items-center gap-5 bg-white hover:bg-slate-50 active:scale-95 active:bg-blue-50 transition-all rounded-2xl p-8 border border-slate-200 hover:border-blue-400 shadow-sm text-slate-600 hover:text-blue-600"
          >
            {TYPE_ICONS[type]}
            <span className="text-slate-900 font-bold text-xl text-center">{t[labelKey]}</span>
          </button>
        ))}
      </div>

      {hasHours && (
        <div className="mt-6 max-w-3xl mx-auto w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-base text-slate-700">
            <span><span className="font-semibold">{t.info_weekdays}:</span> {info.hoursWeekday}</span>
            <span><span className="font-semibold">{t.info_friday}:</span> {info.friClosed ? t.info_closed : info.hoursFri}</span>
            <span><span className="font-semibold">Sa:</span> {info.satClosed ? t.info_closed : info.hoursSat}</span>
            <span><span className="font-semibold">So:</span> {info.sunClosed ? t.info_closed : info.hoursSun}</span>
          </div>
        </div>
      )}

      <div className="mt-4 max-w-3xl mx-auto w-full flex justify-center">
        <button onClick={onBack}
          className="w-full sm:w-auto px-8 py-4 text-xl font-semibold rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 transition-all">
          {t.btn_back}
        </button>
      </div>
    </div>
  )
}
