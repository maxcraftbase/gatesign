'use client'

import { useState } from 'react'

export function AdminLoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (slug: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Login failed')
        setLoading(false)
        return
      }
      onSuccess(data.slug ?? '')
    } catch {
      setError('Network error')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Admin-Login</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base outline-none focus:border-slate-900"
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base outline-none focus:border-slate-900"
            required
          />
          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? '…' : 'Anmelden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
