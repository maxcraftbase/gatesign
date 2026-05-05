'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PasswordPage() {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)
    const res = await fetch('/api/auth/site-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: value }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/')
    } else {
      setError(true)
      setValue('')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold tracking-tight text-slate-900">GateSign</span>
          <p className="text-slate-500 text-sm mt-2">Bitte gib das Zugangspasswort ein.</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-4">
          <input
            type="password"
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Passwort"
            className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
          {error && <p className="text-red-500 text-xs">Falsches Passwort.</p>}
          <button
            type="submit"
            disabled={loading || !value}
            className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Weiter'}
          </button>
        </form>
      </div>
    </div>
  )
}
