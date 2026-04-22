'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const result = await res.json()

    if (!res.ok) {
      setError(result.error ?? 'E-Mail oder Passwort falsch.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">GateSign</h1>
          <p className="text-slate-500 mt-1">Anmelden</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="email"
              label="E-Mail"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="firma@beispiel.de"
              required
              autoComplete="email"
            />
            <Input
              id="password"
              label="Passwort"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" loading={loading} size="lg" className="mt-2">
              Anmelden
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Noch kein Konto?{' '}
            <Link href="/register" className="text-slate-900 font-medium hover:underline">
              Kostenlos registrieren
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
