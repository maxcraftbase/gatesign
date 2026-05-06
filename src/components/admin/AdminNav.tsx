'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

export function AdminNav({ slug, role, userName, companyName }: { slug: string; role?: 'admin' | 'member'; userName?: string | null; companyName?: string }) {
  const pathname = usePathname()
  const base = `/${slug}/admin`

  const isInSettings = pathname.startsWith(`${base}/settings`) || pathname.startsWith(`${base}/users`) || pathname.startsWith(`${base}/audit`)

  const navItems = [
    { href: base, label: 'Einträge', active: pathname === base },
    ...(role === 'admin' ? [
      { href: `${base}/settings`, label: 'Admin', active: isInSettings },
    ] : []),
  ]

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    window.location.href = '/'
  }

  return (
    <header className="bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={base} className="font-bold text-slate-900">GateSign</Link>
          <nav className="flex gap-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {(userName || companyName) && (
            <div className="text-right hidden sm:block">
              {userName && <p className="text-sm font-semibold text-slate-900 leading-tight">{userName}</p>}
              {companyName && <p className="text-xs text-slate-400 leading-tight">{companyName}</p>}
            </div>
          )}
          <Link href={`/${slug}`} className="text-sm font-medium text-slate-700 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50 hover:border-slate-400 transition-colors">
            ← Terminal starten
          </Link>
          <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Abmelden
          </button>
        </div>
      </div>
    </header>
  )
}
