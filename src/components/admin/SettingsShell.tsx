'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import {
  SlidersHorizontal, MonitorCheck, FileText, Users, ScrollText,
  CircleUser, FileSignature, CreditCard, ShieldCheck, MessageSquareText,
  Menu, X,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  exact?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

function buildGroups(slug: string): NavGroup[] {
  const base = `/${slug}/admin`
  return [
    {
      label: 'Terminal',
      items: [
        { href: `${base}/settings`,           label: 'Allgemein',  icon: <SlidersHorizontal className="w-4 h-4" strokeWidth={1.75} />, exact: true },
        { href: `${base}/settings/terminals`, label: 'Terminals',  icon: <MonitorCheck className="w-4 h-4" strokeWidth={1.75} /> },
      ],
    },
    {
      label: 'Belehrung',
      items: [
        { href: `${base}/settings/safety`, label: 'Sicherheitsregeln', icon: <ShieldCheck className="w-4 h-4" strokeWidth={1.75} /> },
        { href: `${base}/settings/hints`,  label: 'Texthinweise',      icon: <MessageSquareText className="w-4 h-4" strokeWidth={1.75} /> },
        { href: `${base}/documents`,       label: 'Dokumente',         icon: <FileText className="w-4 h-4" strokeWidth={1.75} /> },
      ],
    },
    {
      label: 'Team',
      items: [
        { href: `${base}/users`, label: 'Nutzer', icon: <Users className="w-4 h-4" strokeWidth={1.75} /> },
      ],
    },
    {
      label: 'Konto',
      items: [
        { href: `${base}/account`, label: 'Profil',     icon: <CircleUser className="w-4 h-4" strokeWidth={1.75} /> },
        { href: `${base}/billing`, label: 'Abrechnung', icon: <CreditCard className="w-4 h-4" strokeWidth={1.75} /> },
        { href: `${base}/avv`,     label: 'AVV',        icon: <FileSignature className="w-4 h-4" strokeWidth={1.75} /> },
        { href: `${base}/audit`,   label: 'Protokoll',  icon: <ScrollText className="w-4 h-4" strokeWidth={1.75} /> },
      ],
    },
  ]
}

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href)
}

function findActiveLabel(pathname: string, groups: NavGroup[]) {
  for (const group of groups) {
    for (const item of group.items) {
      if (isActive(pathname, item)) return item.label
    }
  }
  return 'Einstellungen'
}

export function SettingsShell({ slug, children }: { slug: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const groups = buildGroups(slug)
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeLabel = findActiveLabel(pathname, groups)

  // Mobile-Menü beim Pfadwechsel schließen
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const navList = (
    <nav className="space-y-5">
      {groups.map(group => (
        <div key={group.label}>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 px-3">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map(item => {
              const active = isActive(pathname, item)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                    )}
                  >
                    <span className={clsx(active ? 'text-indigo-600' : 'text-slate-400')}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )

  return (
    <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
      {/* Mobile-Trigger */}
      <div className="lg:hidden flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Menu className="w-4 h-4" strokeWidth={2} />
          {activeLabel}
        </button>
      </div>

      {/* Desktop-Sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-6">
          {navList}
        </div>
      </aside>

      {/* Mobile-Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[80vw] bg-white shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between px-4 h-14 border-b border-slate-100">
              <span className="font-semibold text-slate-900">Einstellungen</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Schließen"
                className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
            <div className="overflow-y-auto py-5 px-3 flex-1">
              {navList}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="min-w-0">
        {children}
      </div>
    </div>
  )
}
