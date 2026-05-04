'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    setSent(true)
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-slate-900">GateSign</Link>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">E-Mail verschickt</h2>
              <p className="text-sm text-slate-500 mb-6">
                Falls ein Konto mit <strong>{email}</strong> existiert, haben wir einen Reset-Link gesendet. Bitte prüfen Sie Ihren Posteingang.
              </p>
              <Link href="/" className="text-sm text-slate-700 hover:underline font-medium">← Zurück zur Anmeldung</Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Passwort vergessen</h2>
              <p className="text-sm text-slate-500 mb-5">Geben Sie Ihre E-Mail-Adresse ein. Sie erhalten einen Link zum Zurücksetzen.</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@firma.de"
                  required
                  autoComplete="email"
                  className={inputCls}
                />
                {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50">
                  {loading ? 'Sende…' : 'Reset-Link senden'}
                </button>
              </form>
              <p className="text-center text-sm text-slate-400 mt-4">
                <Link href="/" className="text-slate-700 hover:underline font-medium">← Zurück zur Anmeldung</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
