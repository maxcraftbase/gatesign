'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetForm() {
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Read token from URL fragment or query param (only available client-side)
  // generate_link sends access_token directly; forgot-password sends token_hash
  const getTokenInfo = (): { token_hash?: string; access_token?: string } => {
    if (typeof window === 'undefined') return {}
    const hash = window.location.hash
    const params = new URLSearchParams(hash.slice(1))
    const access_token = params.get('access_token') ?? undefined
    const token_hash = params.get('token_hash') ?? searchParams.get('token_hash') ?? undefined
    return { access_token, token_hash }
  }

  function validatePassword(pw: string): string | null {
    if (pw.length < 8) return 'Mindestens 8 Zeichen erforderlich.'
    if (!/[A-Z]/.test(pw)) return 'Mindestens ein Großbuchstabe erforderlich.'
    if (!/[a-z]/.test(pw)) return 'Mindestens ein Kleinbuchstabe erforderlich.'
    if (!/[0-9]/.test(pw)) return 'Mindestens eine Zahl erforderlich.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const pwError = validatePassword(password)
    if (pwError) { setError(pwError); return }
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return }
    const { token_hash, access_token } = getTokenInfo()
    if (!token_hash && !access_token) { setError('Ungültiger Reset-Link.'); return }

    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token_hash, access_token, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Fehler beim Zurücksetzen.'); return }
    setSuccess(true)
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100'

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
      {success ? (
        <div className="text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Passwort geändert</h2>
          <p className="text-sm text-slate-500 mb-6">Sie können sich jetzt mit Ihrem neuen Passwort anmelden.</p>
          <Link href="/" className="inline-block w-full py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors text-center">
            Zur Anmeldung
          </Link>
        </div>
      ) : (
        <>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Neues Passwort setzen</h2>
          <p className="text-xs text-slate-400 mb-5">Min. 8 Zeichen · Groß- & Kleinbuchstaben · Zahl</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Neues Passwort" required autoComplete="new-password" className={inputCls} />
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Passwort wiederholen" required autoComplete="new-password" className={inputCls} />
            {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 mt-1">
              {loading ? 'Speichern…' : 'Passwort speichern'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-slate-900">GateSign</Link>
        </div>
        <Suspense fallback={<div className="bg-white rounded-2xl p-8 text-center text-slate-400">Laden…</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
