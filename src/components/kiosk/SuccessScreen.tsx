'use client'

import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import { translations, type Language } from '@/lib/translations'

interface SuccessScreenProps {
  lang: Language
  onReset: () => void
  /** Wenn gesetzt: Karten-Nummer wird gross angezeigt (Drucker-Add-on) */
  cardNumber?: number | null
}

export function SuccessScreen({ lang, onReset, cardNumber }: SuccessScreenProps) {
  const t = translations[lang]
  const [countdown, setCountdown] = useState(cardNumber ? 15 : 10)  // mehr Zeit wenn Karte abzulesen

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

  const formattedNumber = cardNumber != null
    ? String(cardNumber).padStart(3, '0')
    : null

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 px-8 py-8">
      <div className="bg-white rounded-3xl shadow-lg p-10 text-center max-w-2xl w-full">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-20 h-20 text-emerald-500" strokeWidth={1.5} />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 mb-2">{t.success_title}</h2>
        <p className="text-xl text-slate-600 mb-6">{t.success_subtitle}</p>

        {/* ── Tagesnummer (nur wenn Drucker-Add-on aktiv) ── */}
        {formattedNumber && (
          <div className="my-8 py-8 px-6 bg-slate-50 border border-slate-200 rounded-2xl">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
              {t.your_card_number}
            </p>
            <p className="text-8xl font-black text-red-600 leading-none tracking-tight tabular-nums mb-4">
              {formattedNumber}
            </p>
            <p className="text-lg text-slate-700 font-medium">
              {t.take_card_hint}
            </p>
          </div>
        )}

        {/* Standard-Hint nur ohne Karte (sonst dominiert die Tagesnummer) */}
        {!formattedNumber && (
          <p className="text-base text-slate-400 mb-6">{t.success_hint}</p>
        )}

        <button
          onClick={onReset}
          className="w-full py-4 text-xl font-semibold rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white transition-all"
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
