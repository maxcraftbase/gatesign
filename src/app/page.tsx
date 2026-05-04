'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'E-Mail oder Passwort falsch.')
      setLoading(false)
      return
    }
    if (data.slug) {
      window.location.href = `/${data.slug}/admin`
    } else {
      setError('Kein Unternehmenskonto gefunden.')
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">GateSign</h1>
          <p className="text-slate-500">Digitales Kiosk-Check-in für Ihr Unternehmen</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 mb-4">
          <h2 className="text-lg font-bold text-slate-900 mb-5">Anmelden</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">E-Mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@firma.de" required autoComplete="email" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Passwort</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password" className={inputCls} />
            </div>
            <div className="text-right -mt-1">
              <Link href="/forgot-password" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
                Passwort vergessen?
              </Link>
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 mt-1">
              {loading ? 'Anmelden…' : 'Anmelden'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400">
          Noch kein Konto?{' '}
          <Link href="/register" className="text-slate-700 hover:underline font-medium">Kostenlos registrieren</Link>
        </p>
      </div>
    </div>
  )
}
