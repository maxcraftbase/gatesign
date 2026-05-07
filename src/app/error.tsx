'use client'

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Etwas ist schiefgelaufen</h2>
        <p className="text-slate-500 text-sm mb-6">Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.</p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  )
}
