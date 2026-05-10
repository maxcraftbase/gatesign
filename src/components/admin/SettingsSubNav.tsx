'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { SlidersHorizontal, MonitorCheck, FileText, Users, ScrollText, CircleUser } from 'lucide-react'

interface TabItem {
  href: string
  label: string
  icon: React.ReactNode
  exact?: boolean
}

interface TabGroup {
  label: string
  items: TabItem[]
}

export function SettingsSubNav({ slug }: { slug: string }) {
  const pathname = usePathname()
  const base = `/${slug}/admin`

  const groups: TabGroup[] = [
    {
      label: 'Terminal',
      items: [
        { href: `${base}/settings`,           label: 'Allgemein',  icon: <SlidersHorizontal className="w-3.5 h-3.5" />, exact: true },
        { href: `${base}/settings/terminals`, label: 'Terminals',  icon: <MonitorCheck className="w-3.5 h-3.5" /> },
        { href: `${base}/documents`,          label: 'Dokumente',  icon: <FileText className="w-3.5 h-3.5" /> },
      ],
    },
    {
      label: 'Team',
      items: [
        { href: `${base}/users`, label: 'Nutzer', icon: <Users className="w-3.5 h-3.5" /> },
      ],
    },
    {
      label: 'Konto',
      items: [
        { href: `${base}/account`, label: 'Profil',    icon: <CircleUser className="w-3.5 h-3.5" /> },
        { href: `${base}/audit`,   label: 'Protokoll', icon: <ScrollText className="w-3.5 h-3.5" /> },
      ],
    },
  ]

  function isActive(tab: TabItem) {
    return tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
  }

  return (
    <div className="mb-8">
      <div className="flex items-end gap-1 border-b border-slate-200 pb-0 overflow-x-auto">
        {groups.map((group, gi) => (
          <div key={group.label} className="flex items-end gap-0.5">
            {/* Group divider (not before first group) */}
            {gi > 0 && (
              <div className="w-px h-5 bg-slate-200 self-center mx-1 shrink-0" />
            )}
            {/* Group label + tabs */}
            <div className="flex flex-col items-start gap-0">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 pb-0.5 whitespace-nowrap">
                {group.label}
              </span>
              <div className="flex gap-0.5">
                {group.items.map(tab => {
                  const active = isActive(tab)
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors -mb-px whitespace-nowrap',
                        active
                          ? 'border-slate-900 text-slate-900 bg-white'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      )}
                    >
                      {tab.icon}
                      {tab.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
