'use client'

import { LANGUAGES, type Language } from '@/lib/translations'

export function LanguageSelect({ onSelect, onBack }: { onSelect: (lang: Language) => void; onBack: () => void }) {
  return (
    <div className="flex flex-col flex-1 px-6 py-4">
      <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">
        Sprache wählen / Choose language
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-4xl mx-auto w-full">
        {LANGUAGES.map(lang => (
          <button
            key={lang.code}
            onClick={() => onSelect(lang.code)}
            className="flex flex-col items-center gap-3 bg-white hover:bg-slate-50 active:scale-95 active:bg-blue-50 transition-all rounded-2xl p-5 border border-slate-200 hover:border-blue-500 shadow-sm"
          >
            <span className="text-5xl">{lang.flag}</span>
            <span className="text-slate-900 font-semibold text-lg">{lang.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 max-w-4xl mx-auto w-full flex justify-center">
        <button onClick={onBack}
          className="px-8 py-4 text-xl font-semibold rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 transition-all">
          Zurück / Back
        </button>
      </div>
    </div>
  )
}
