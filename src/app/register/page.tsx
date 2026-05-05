'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function validatePassword(pw: string): string | null {
    if (pw.length < 8) return 'Mindestens 8 Zeichen erforderlich.'
    if (!/[A-Z]/.test(pw)) return 'Mindestens ein Großbuchstabe erforderlich.'
    if (!/[a-z]/.test(pw)) return 'Mindestens ein Kleinbuchstabe erforderlich.'
    if (!/[0-9]/.test(pw)) return 'Mindestens eine Zahl erforderlich.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const pwError = validatePassword(password)
    if (pwError) { setError(pwError); setLoading(false); return }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, email, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Registrierung fehlgeschlagen.')
      setLoading(false)
      return
    }

    window.location.href = `/${data.slug}/admin`
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-slate-900">GateSign</Link>
          <p className="text-slate-500 mt-1 text-sm">Digitales Check-in Terminal für Ihr Unternehmen</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-5">Kostenfrei registrieren</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Firmenname</label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                placeholder="z.B. Muster Logistik GmbH" required autoComplete="organization"
                className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">E-Mail-Adresse</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@firma.de" required autoComplete="email"
                className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Passwort</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 Zeichen, Groß- & Kleinbuchstaben, Zahl" required autoComplete="new-password"
                className={inputCls} />
              <p className="text-xs text-slate-400 mt-1">Min. 8 Zeichen · Groß- & Kleinbuchstaben · Zahl</p>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 mt-2">
              {loading ? 'Wird eingerichtet…' : 'Konto erstellen'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-4">
          Bereits registriert?{' '}
          <Link href="/" className="text-slate-700 hover:underline font-medium">Zur Startseite</Link>
        </p>
      </div>
    </div>
  )
}
