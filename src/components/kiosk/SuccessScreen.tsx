'use client'

import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import { translations, type Language } from '@/lib/translations'

export function SuccessScreen({ lang, onReset }: { lang: Language; onReset: () => void }) {
  const t = translations[lang]
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval)
          onReset()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [onReset])

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 px-8">
      <div className="bg-white rounded-3xl shadow-lg p-12 text-center max-w-lg w-full">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-24 h-24 text-emerald-500" strokeWidth={1.5} />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 mb-3">{t.success_title}</h2>
        <p className="text-2xl text-slate-600 mb-3">{t.success_subtitle}</p>
        <p className="text-lg text-slate-400 mb-8">{t.success_hint}</p>
        <button
          onClick={onReset}
          className="w-full py-4 text-xl font-semibold rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white transition-all"
        >
          {t.btn_new_checkin}
        </button>
        <p className="text-slate-400 text-base mt-4">
          {lang === 'de' ? `Automatischer Reset in ${countdown}s` : `Auto-reset in ${countdown}s`}
        </p>
      </div>
    </div>
  )
}
