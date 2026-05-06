'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

export function SettingsSubNav({ slug }: { slug: string }) {
  const pathname = usePathname()
  const base = `/${slug}/admin`

  const tabs = [
    { href: `${base}/settings`,   label: 'Allgemein' },
    { href: `${base}/users`,      label: 'Nutzer & Ansprechpartner' },
    { href: `${base}/documents`,  label: 'Dokumente' },
    { href: `${base}/audit`,      label: 'Protokoll' },
  ]

  return (
    <div className="flex gap-1 mb-8 border-b border-slate-200 pb-0">
      {tabs.map(tab => {
        const active = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              'px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors -mb-px',
              active
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
