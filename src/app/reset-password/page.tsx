'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Read hash tokens immediately on first client render (before any effects strip the hash)
function readHashTokens(): { accessToken?: string; tokenHash?: string } {
  if (typeof window === 'undefined') return {}
  const hash = window.location.hash
  if (!hash) {
    // Fallback: check sessionStorage (populated by inline script before hydration)
    const saved = sessionStorage.getItem('gs_reset_hash')
    if (saved) {
      sessionStorage.removeItem('gs_reset_hash')
      const p = new URLSearchParams(saved.replace(/^#/, ''))
      return { accessToken: p.get('access_token') ?? undefined, tokenHash: p.get('token_hash') ?? undefined }
    }
    return {}
  }
  const p = new URLSearchParams(hash.slice(1))
  return { accessToken: p.get('access_token') ?? undefined, tokenHash: p.get('token_hash') ?? undefined }
}

function ResetForm() {
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  // Lazy initializer runs during first client render — before any effect can strip the hash
  const [accessToken] = useState<string | undefined>(() => readHashTokens().accessToken)
  const [tokenHash] = useState<string | undefined>(() => {
    const { tokenHash: th } = readHashTokens()
    return th ?? searchParams.get('token_hash') ?? undefined
  })

  // Clean up the hash from the URL after capturing tokens
  useEffect(() => {
    if (accessToken || tokenHash) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [accessToken, tokenHash])

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
    if (!tokenHash && !accessToken) { setError('Ungültiger Reset-Link. Bitte fordere eine neue Einladung an.'); return }

    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token_hash: tokenHash, access_token: accessToken, password }),
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
          <h2 className="text-lg font-bold text-slate-900 mb-2">Passwort gesetzt</h2>
          <p className="text-sm text-slate-500 mb-6">Du kannst dich jetzt mit deinem neuen Passwort anmelden.</p>
          <Link href="/login" className="inline-block w-full py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors text-center">
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
      {/* Capture hash into sessionStorage before React hydration can strip it */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function(){
          var h = window.location.hash;
          if (h && h.includes('access_token')) {
            try { sessionStorage.setItem('gs_reset_hash', h); } catch(e) {}
          }
        })();
      ` }} />
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
