'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function RegisterPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben.')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { company_name: companyName } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: companyError } = await supabase.from('companies').insert({
        user_id: data.user.id,
        name: companyName,
        email,
      })

      if (companyError) {
        setError('Konto erstellt, aber Firmenprofil konnte nicht angelegt werden.')
        setLoading(false)
        return
      }
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">GateSign</h1>
          <p className="text-slate-500 mt-1">Konto erstellen</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="company"
              label="Firmenname"
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Muster GmbH"
              required
            />
            <Input
              id="email"
              label="E-Mail"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="max@musterfirma.de"
              required
              autoComplete="email"
            />
            <Input
              id="password"
              label="Passwort"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              required
              autoComplete="new-password"
            />

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" loading={loading} size="lg" className="mt-2">
              Konto erstellen
            </Button>
          </form>

          <p className="mt-4 text-xs text-slate-400 text-center">
            Mit der Registrierung starten Sie eine kostenlose Testphase.
          </p>

          <div className="mt-4 text-center text-sm text-slate-500">
            Bereits registriert?{' '}
            <Link href="/login" className="text-slate-900 font-medium hover:underline">
              Anmelden
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
