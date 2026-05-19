'use client'

export function WelcomeScreen({
  title,
  subtitle,
  companyName,
  logoUrl,
  terminalName,
  onStart,
}: {
  title: string
  subtitle: string
  companyName: string
  logoUrl: string
  terminalName?: string
  onStart: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-10 px-8">
      <div className="text-center flex flex-col items-center">
        {logoUrl && (
          <div className="mb-4 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="Logo" className="max-h-16 max-w-xs object-contain drop-shadow-sm" />
          </div>
        )}
        {companyName && (
          <p className="text-xl font-semibold text-slate-600 mb-3 tracking-wide">{companyName}</p>
        )}
        {terminalName && (
          <span className="mb-4 text-sm font-medium text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full">{terminalName}</span>
        )}
        <h1 className="text-5xl font-bold text-slate-900 mb-4 leading-tight">{title}</h1>
        <p className="text-2xl text-slate-500">{subtitle}</p>
      </div>
      <button
        onClick={onStart}
        className="bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all text-slate-900 text-3xl font-bold px-16 py-6 rounded-2xl shadow-sm"
      >
        Check-in starten
      </button>
      <p className="text-xs text-slate-400 text-center max-w-lg leading-relaxed">
        Mit dem Check-in werden Ihre Angaben (Name, Fahrzeugkennzeichen, ggf. Unterschrift) zum Zweck der Zutrittskontrolle verarbeitet und gespeichert. /
        By checking in, your data (name, licence plate, signature if applicable) is processed for access control purposes.
      </p>
    </div>
  )
}
