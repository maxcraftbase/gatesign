import Link from 'next/link'

export function AvvBanner({ slug }: { slug: string }) {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div className="text-sm">
            <p className="font-semibold text-amber-900">Auftragsverarbeitungsvertrag noch nicht unterzeichnet</p>
            <p className="text-amber-800 mt-0.5">
              Nach Art. 28 DSGVO ist ein AVV zwischen Ihrem Unternehmen und GateSign erforderlich.
              Die Unterzeichnung dauert ca. 2 Minuten.
            </p>
          </div>
        </div>
        <Link
          href={`/${slug}/admin/avv`}
          className="self-start sm:self-center shrink-0 inline-flex items-center gap-2 bg-amber-900 hover:bg-amber-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Jetzt unterzeichnen
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
