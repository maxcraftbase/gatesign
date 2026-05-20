'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'
import { ChevronDown, ClipboardList, Home, Settings, LogOut, MonitorCheck } from 'lucide-react'
import type { Terminal } from '@/lib/company'

export function AdminNav({ slug, role, userName, companyName, terminals = [] }: {
  slug: string
  role?: 'admin' | 'member'
  userName?: string | null
  companyName?: string
  terminals?: Terminal[]
}) {
  const pathname = usePathname()
  const base = `/${slug}/admin`
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isInSettings = pathname.startsWith(`${base}/settings`) || pathname.startsWith(`${base}/users`) || pathname.startsWith(`${base}/audit`) || pathname.startsWith(`${base}/documents`) || pathname.startsWith(`${base}/account`) || pathname.startsWith(`${base}/avv`)

  const navItems = [
    { href: base, label: 'Einträge', icon: <ClipboardList className="w-4 h-4" />, active: pathname === base },
    { href: `${base}/in-building`, label: 'Im Haus', icon: <Home className="w-4 h-4" />, active: pathname.startsWith(`${base}/in-building`) },
    ...(role === 'admin' ? [
      { href: `${base}/settings`, label: 'Einstellungen', icon: <Settings className="w-4 h-4" />, active: isInSettings },
    ] : []),
  ]

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    window.location.href = '/'
  }

  const activeTerminals = terminals.filter(t => t.is_active)

  return (
    <header className="bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={base} className="font-bold text-slate-900 tracking-tight">GateSign</Link>
          <nav className="flex gap-0.5">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* User info */}
          {(userName || companyName) && (
            <div className="text-right hidden sm:block leading-tight">
              {userName && <p className="text-sm font-semibold text-slate-900">{userName}</p>}
              {companyName && <p className="text-xs text-slate-400">{companyName}</p>}
            </div>
          )}

          {/* Terminal launcher */}
          {activeTerminals.length <= 1 ? (
            <Link
              href={`/${slug}/${activeTerminals[0]?.slug ?? ''}`}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 hover:border-slate-400 transition-colors"
            >
              <MonitorCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Terminal</span>
            </Link>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 hover:border-slate-400 transition-colors"
              >
                <MonitorCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Terminal</span>
                <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform', dropdownOpen && 'rotate-180')} />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                  {activeTerminals.map(t => (
                    <Link
                      key={t.id}
                      href={`/${slug}/${t.slug}`}
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-medium">{t.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            title="Abmelden"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Abmelden</span>
          </button>
        </div>
      </div>
    </header>
  )
}
