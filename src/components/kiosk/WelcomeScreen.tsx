'use client'

import { LogIn, LogOut } from 'lucide-react'

interface WelcomeScreenProps {
  title: string
  subtitle: string
  companyName: string
  logoUrl: string
  terminalName?: string
  /** Hauptaktion — Check-in starten */
  onCheckIn: () => void
  /** Optional: Checkout-Aktion. Nur sichtbar wenn gesetzt (Drucker-Add-on aktiv). */
  onCheckOut?: () => void
  /** i18n-Labels — werden im Drucker-Add-on-Modus genutzt */
  checkInLabel?: string
  checkOutLabel?: string
}

export function WelcomeScreen({
  title,
  subtitle,
  companyName,
  logoUrl,
  terminalName,
  onCheckIn,
  onCheckOut,
  checkInLabel,
  checkOutLabel,
}: WelcomeScreenProps) {
  const showSplit = !!onCheckOut
  const hasLogo = !!logoUrl && /^https?:\/\//i.test(logoUrl)

  return (
    <div
      className="
        flex flex-col items-center justify-center flex-1 px-8 py-10
        bg-gradient-to-b from-white via-white to-slate-50
      "
    >
      {/* ─── Brand-Anchor: Logo ist der Held — groß & selbstbewusst (wenn vorhanden) ─── */}
      {hasLogo && (
        <div className="mb-5 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt={companyName || 'Logo'}
            className="max-h-28 md:max-h-36 w-auto object-contain"
          />
        </div>
      )}

      {terminalName && (
        <span
          className="
            mb-8 text-sm font-medium text-slate-500
            bg-white border border-slate-200
            px-4 py-1.5 rounded-full
            shadow-sm
          "
        >
          {terminalName}
        </span>
      )}

      {/* ─── Welcome-Headline: trägt allein wenn kein Logo, tritt sonst hinter das Logo zurück ─── */}
      <div className={`text-center max-w-4xl ${hasLogo ? 'mb-10' : 'mb-12'}`}>
        <h2
          className={`
            text-slate-900 mb-4 leading-tight tracking-tight
            ${hasLogo
              ? 'text-3xl font-semibold'
              : 'text-6xl md:text-7xl font-bold'}
          `}
        >
          {title}
        </h2>
        <p className={`text-slate-500 leading-relaxed ${hasLogo ? 'text-lg' : 'text-2xl'}`}>
          {subtitle}
        </p>
      </div>

      {/* ─── Single-Button (ohne Drucker-Add-on) ─── */}
      {!showSplit && (
        <button
          onClick={onCheckIn}
          className="
            bg-indigo-600 hover:bg-indigo-700 active:scale-95
            text-white text-2xl font-bold
            px-16 py-6 rounded-2xl
            shadow-md transition-all
          "
        >
          {checkInLabel ?? 'Check in'}
        </button>
      )}

      {/* ─── Split: Check in / Check out ─── */}
      {showSplit && (
        <div className="flex flex-col sm:flex-row gap-5 w-full max-w-3xl">
          <button
            onClick={onCheckIn}
            className="
              group flex-1 relative overflow-hidden
              bg-indigo-600 hover:bg-indigo-700
              text-white rounded-3xl px-10 py-12
              shadow-lg shadow-indigo-600/20
              transition-all duration-150
              active:scale-[0.98]
            "
          >
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/15 transition-colors" />
            <div className="relative flex flex-col items-center gap-3">
              <LogIn className="w-14 h-14 text-white" strokeWidth={1.6} />
              <span className="text-3xl font-bold tracking-tight">
                {checkInLabel ?? 'Check in'}
              </span>
            </div>
          </button>

          <button
            onClick={onCheckOut}
            className="
              group flex-1 relative
              bg-white hover:bg-slate-50
              text-slate-900 border border-slate-200
              rounded-3xl px-10 py-12
              shadow-sm
              transition-all duration-150
              active:scale-[0.98]
            "
          >
            <div className="flex flex-col items-center gap-3">
              <LogOut className="w-14 h-14 text-slate-700" strokeWidth={1.6} />
              <span className="text-3xl font-bold tracking-tight">
                {checkOutLabel ?? 'Check out'}
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
