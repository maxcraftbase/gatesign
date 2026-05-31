'use client'

import { Lock } from 'lucide-react'
import { useParams } from 'next/navigation'

/**
 * Einheitlicher Upsell-Block für gesperrte Add-on-Funktionen im Admin-Bereich.
 * Wird angezeigt, statt eine Funktion ins Leere (oder in eine rohe 403-Antwort)
 * laufen zu lassen. Verlinkt direkt in den Tarif-/Add-on-Bereich der Company.
 *
 * Slate + Indigo, Lucide-Lock — passt zum bestehenden Admin-Design.
 */
export function AddonUpsell({
  title,
  description,
  className = '',
}: {
  title: string
  description: string
  className?: string
}) {
  const params = useParams<{ slug?: string }>()
  const billingHref = params?.slug ? `/${params.slug}/admin/billing` : '/'

  return (
    <div className={`flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
        <Lock className="w-4 h-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <a
        href={billingHref}
        className="shrink-0 self-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
      >
        Freischalten
      </a>
    </div>
  )
}
