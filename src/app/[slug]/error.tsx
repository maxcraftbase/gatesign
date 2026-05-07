'use client'

export default function TerminalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <p className="text-slate-500 text-lg mb-4">Ein Fehler ist aufgetreten.</p>
        <button
          onClick={reset}
          className="px-8 py-3 bg-slate-900 text-white text-lg font-semibold rounded-2xl hover:bg-slate-700 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  )
}
