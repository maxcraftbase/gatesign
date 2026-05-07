'use client'

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <p className="text-slate-500 mb-4">Ein Fehler ist aufgetreten.</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  )
}
