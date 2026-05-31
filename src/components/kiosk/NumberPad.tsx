'use client'

/**
 * Touch-optimiertes Number-Pad für Self-Service-Eingabe (z.B. Checkout-Karten-Nummer).
 *
 * Layout: 3×4 Grid mit Ziffern 1–9, dann Reihe „Löschen / 0 / OK".
 * Groß genug für Finger-Eingabe auf Tablets/iPads (Buttons ~ 96 px).
 * Slate + Indigo Design-System.
 */

import { Delete, Check } from 'lucide-react'

interface NumberPadProps {
  value: string
  onChange: (next: string) => void
  onSubmit: () => void
  maxLength?: number
  disabled?: boolean
  clearLabel?: string
  okLabel?: string
}

export function NumberPad({
  value,
  onChange,
  onSubmit,
  maxLength = 6,
  disabled = false,
  clearLabel = 'Löschen',
  okLabel = 'OK',
}: NumberPadProps) {
  function append(digit: string) {
    if (disabled) return
    if (value.length >= maxLength) return
    onChange(value + digit)
  }

  function clear() {
    if (disabled) return
    onChange(value.slice(0, -1))
  }

  function submit() {
    if (disabled || value.length === 0) return
    onSubmit()
  }

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-md">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
        <DigitButton key={digit} onPress={() => append(digit)} disabled={disabled}>
          {digit}
        </DigitButton>
      ))}
      <ActionButton onPress={clear} disabled={disabled} variant="clear">
        <Delete className="w-7 h-7" strokeWidth={2} />
        <span className="text-base font-medium mt-1">{clearLabel}</span>
      </ActionButton>
      <DigitButton onPress={() => append('0')} disabled={disabled}>
        0
      </DigitButton>
      <ActionButton onPress={submit} disabled={disabled || value.length === 0} variant="ok">
        <Check className="w-7 h-7" strokeWidth={2.5} />
        <span className="text-base font-semibold mt-1">{okLabel}</span>
      </ActionButton>
    </div>
  )
}

function DigitButton({
  children,
  onPress,
  disabled,
}: {
  children: React.ReactNode
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className="
        h-24 rounded-2xl
        bg-white border border-slate-200
        text-4xl font-semibold text-slate-900
        shadow-sm
        transition-all duration-100
        hover:bg-slate-50 hover:border-slate-300
        active:scale-95 active:bg-slate-100
        disabled:opacity-40 disabled:active:scale-100
      "
    >
      {children}
    </button>
  )
}

function ActionButton({
  children,
  onPress,
  disabled,
  variant,
}: {
  children: React.ReactNode
  onPress: () => void
  disabled?: boolean
  variant: 'clear' | 'ok'
}) {
  const styles = variant === 'ok'
    ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200'
    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'

  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={`
        h-24 rounded-2xl border shadow-sm
        flex flex-col items-center justify-center
        transition-all duration-100
        active:scale-95
        disabled:opacity-40 disabled:active:scale-100
        ${styles}
      `}
    >
      {children}
    </button>
  )
}
