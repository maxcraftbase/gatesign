'use client'

/**
 * Self-Service-Checkout-Flow am Terminal.
 *
 * Besucher tippt seine Tagesnummer ein, drückt OK → /api/check-out wird aufgerufen.
 * Bei Erfolg: Bestätigungs-Screen mit Namen + Auto-Reset nach 5 Sekunden.
 * Bei Fehler („nicht gefunden"): Nummer wird gelöscht, freundlicher Hinweis.
 */

import { useState, useEffect } from 'react'
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { NumberPad } from './NumberPad'
import { translations, type Language } from '@/lib/translations'

interface CheckoutFlowProps {
  lang: Language
  slug: string
  /** Terminal-Slug — nötig, damit der Checkout auf das richtige Terminal scopt
   *  (Tagesnummern sind pro Terminal eindeutig, nicht pro Firma). */
  terminalSlug?: string
  onBack: () => void
  onReset: () => void
}

type Step = 'input' | 'submitting' | 'success' | 'error'

export function CheckoutFlow({ lang, slug, terminalSlug, onBack, onReset }: CheckoutFlowProps) {
  const t = translations[lang]
  const [step, setStep] = useState<Step>('input')
  const [value, setValue] = useState('')
  const [visitorName, setVisitorName] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(5)

  // Auto-Reset nach erfolgreichem Checkout
  useEffect(() => {
    if (step !== 'success') return
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
  }, [step, onReset])

  // Bei Fehler: nach 3s Eingabefeld wieder freigeben
  useEffect(() => {
    if (step !== 'error') return
    const timeout = setTimeout(() => {
      setValue('')
      setStep('input')
    }, 3000)
    return () => clearTimeout(timeout)
  }, [step])

  async function handleSubmit() {
    if (!value || step !== 'input') return
    setStep('submitting')
    try {
      const res = await fetch('/api/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          terminal_slug: terminalSlug ?? null,
          card_number: Number.parseInt(value, 10),
        }),
      })
      if (res.ok) {
        const data = await res.json() as { visitor_name?: string }
        setVisitorName(data.visitor_name ?? null)
        setStep('success')
      } else {
        setStep('error')
      }
    } catch {
      setStep('error')
    }
  }

  // ── Erfolgs-Screen ──────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-8 px-8 py-8">
        <div className="bg-white rounded-3xl shadow-lg p-10 text-center max-w-2xl w-full">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-20 h-20 text-emerald-500" strokeWidth={1.5} />
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-2">{t.checkout_success_title}</h2>
          {visitorName && (
            <p className="text-xl text-slate-700 mb-2">{visitorName}</p>
          )}
          <p className="text-lg text-slate-500 mb-2">{t.checkout_success_subtitle}</p>

          {/* ── Karte abgeben (prominent) ── */}
          <div className="my-8 py-8 px-6 bg-slate-50 border border-slate-200 rounded-2xl">
            <p className="text-3xl font-bold text-slate-900">
              {t.leave_card_here}
            </p>
          </div>

          <p className="text-slate-400 text-base mt-4">
            {lang === 'de' ? `Automatischer Reset in ${countdown}s` : `Auto-reset in ${countdown}s`}
          </p>
        </div>
      </div>
    )
  }

  // ── Input + Fehler-Modus ────────────────────────────────────────────────────
  const showError = step === 'error'

  return (
    <div className="flex flex-col flex-1 items-center px-8 pt-8 pb-12">
      <button
        onClick={onBack}
        className="self-start flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-lg">{t.btn_back}</span>
      </button>

      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-slate-900 mb-3">{t.checkout_title}</h2>
        <p className="text-xl text-slate-500">{t.checkout_subtitle}</p>
      </div>

      {/* Eingabe-Display */}
      <div
        className={`
          w-full max-w-md h-32 rounded-2xl border-2 mb-6
          flex items-center justify-center
          transition-colors duration-200
          ${showError
            ? 'bg-red-50 border-red-300'
            : 'bg-white border-slate-200'}
        `}
      >
        {value.length === 0 && !showError && (
          <span className="text-slate-300 text-5xl font-light tracking-widest">– – –</span>
        )}
        {value.length > 0 && !showError && (
          <span className="text-slate-900 text-6xl font-bold tracking-wider tabular-nums">
            {value}
          </span>
        )}
        {showError && (
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-8 h-8" />
            <span className="text-2xl font-medium">{t.checkout_not_found}</span>
          </div>
        )}
      </div>

      <NumberPad
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        disabled={step !== 'input'}
        maxLength={5}
        clearLabel={t.btn_clear}
        okLabel={t.btn_ok}
      />
    </div>
  )
}
