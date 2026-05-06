'use client'

import { useState, useEffect } from 'react'
import { AdminSettingsClient } from '@/app/admin/settings/settings-client'
import { Lock } from 'lucide-react'

export default function SettingsPage() {
  const [unlocked, setUnlocked] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('gs-settings-unlocked') === '1') {
      setUnlocked(true)
    }
    setChecking(false)
  }, [])

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/settings-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (res.ok) {
        sessionStorage.setItem('gs-settings-unlocked', '1')
        setUnlocked(true)
      } else {
        setError(data.error ?? 'Falsches Passwort')
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }

  if (checking) return null

  if (!unlocked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-sm">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Lock className="w-6 h-6 text-slate-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 text-center mb-1">Einstellungen</h2>
          <p className="text-sm text-slate-500 text-center mb-6">Bitte Masterpasswort eingeben</p>
          <form onSubmit={handleUnlock} className="flex flex-col gap-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Masterpasswort"
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
              required
            />
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors">
              {loading ? 'Prüfe…' : 'Zugang öffnen'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <AdminSettingsClient />
}
