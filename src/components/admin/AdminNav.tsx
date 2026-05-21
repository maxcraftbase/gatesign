'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'
import {
  ChevronDown, ClipboardList, Home, Settings,
  LogOut, MonitorCheck, CircleUser, CreditCard, FileSignature, ScrollText,
} from 'lucide-react'
import type { Terminal } from '@/lib/company'

function getInitials(name?: string | null) {
  if (!name) return '–'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '–'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function AdminNav({ slug, role, userName, companyName, terminals = [] }: {
  slug: string
  role?: 'admin' | 'member'
  userName?: string | null
  companyName?: string
  terminals?: Terminal[]
}) {
  const pathname = usePathname()
  const base = `/${slug}/admin`
  const [termOpen, setTermOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const termRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  const isInSettings =
    pathname.startsWith(`${base}/settings`) ||
    pathname.startsWith(`${base}/users`) ||
    pathname.startsWith(`${base}/documents`)

  const navItems = [
    { href: base,                       label: 'Einträge',      icon: <ClipboardList className="w-4 h-4" strokeWidth={1.75} />, active: pathname === base },
    { href: `${base}/in-building`,      label: 'Im Haus',       icon: <Home          className="w-4 h-4" strokeWidth={1.75} />, active: pathname.startsWith(`${base}/in-building`) },
    ...(role === 'admin' ? [
      { href: `${base}/settings`,       label: 'Einstellungen', icon: <Settings      className="w-4 h-4" strokeWidth={1.75} />, active: isInSettings },
    ] : []),
  ]

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (termRef.current && !termRef.current.contains(e.target as Node)) setTermOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    window.location.href = '/'
  }

  const activeTerminals = terminals.filter(t => t.is_active)
  const initials = getInitials(userName ?? companyName)

  return (
    <header className="bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Links: Logo + Nav-Items */}
        <div className="flex items-center gap-6 min-w-0">
          <Link href={base} className="font-bold text-slate-900 tracking-tight shrink-0">
            GateSign
          </Link>
          <nav className="flex gap-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                  item.active
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                <span className={clsx(item.active ? 'text-indigo-600' : 'text-slate-400')}>
                  {item.icon}
                </span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Rechts: Terminal + User-Menu */}
        <div className="flex items-center gap-1">
          {/* Terminal-Launcher */}
          {activeTerminals.length <= 1 ? (
            <Link
              href={`/${slug}/${activeTerminals[0]?.slug ?? ''}`}
              title="Terminal öffnen"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <MonitorCheck className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
              <span className="hidden sm:inline">Terminal</span>
            </Link>
          ) : (
            <div className="relative" ref={termRef}>
              <button
                type="button"
                onClick={() => { setTermOpen(o => !o); setUserOpen(false) }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <MonitorCheck className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
                <span className="hidden sm:inline">Terminal</span>
                <ChevronDown className={clsx('w-3.5 h-3.5 text-slate-400 transition-transform', termOpen && 'rotate-180')} strokeWidth={2} />
              </button>
              {termOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                  {activeTerminals.map(t => (
                    <Link
                      key={t.id}
                      href={`/${slug}/${t.slug}`}
                      onClick={() => setTermOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-medium">{t.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Trenner */}
          <div className="w-px h-6 bg-slate-200 mx-1" aria-hidden="true" />

          {/* User-Menu */}
          <div className="relative" ref={userRef}>
            <button
              type="button"
              onClick={() => { setUserOpen(o => !o); setTermOpen(false) }}
              className="inline-flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                {initials}
              </span>
              {(userName || companyName) && (
                <div className="hidden md:block text-left leading-tight max-w-[160px]">
                  {userName && <p className="text-xs font-semibold text-slate-900 truncate">{userName}</p>}
                  {companyName && <p className="text-[10px] text-slate-400 truncate">{companyName}</p>}
                </div>
              )}
              <ChevronDown className={clsx('w-3.5 h-3.5 text-slate-400 transition-transform shrink-0', userOpen && 'rotate-180')} strokeWidth={2} />
            </button>
            {userOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                {(userName || companyName) && (
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      {userName && <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>}
                      {companyName && <p className="text-xs text-slate-500 truncate mt-0.5">{companyName}</p>}
                    </div>
                  </div>
                )}
                <Link
                  href={`${base}/account`}
                  onClick={() => setUserOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <CircleUser className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                  Profil
                </Link>
                {role === 'admin' && (
                  <>
                    <Link
                      href={`${base}/billing`}
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                      Abrechnung
                    </Link>
                    <Link
                      href={`${base}/avv`}
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <FileSignature className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                      AVV
                    </Link>
                    <Link
                      href={`${base}/audit`}
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <ScrollText className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                      Protokoll
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
                >
                  <LogOut className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                  Abmelden
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
