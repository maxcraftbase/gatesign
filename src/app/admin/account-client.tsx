'use client'

import { useState, useEffect } from 'react'
import { Save, Eye, EyeOff } from 'lucide-react'

const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100'
const labelCls = 'block text-sm font-semibold text-slate-700 mb-1.5'

export function AccountClient() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch('/api/admin/account')
      .then(r => r.json())
      .then((d: { name?: string; email?: string; phone?: string }) => {
        setName(d.name ?? '')
        setEmail(d.email ?? '')
        setPhone(d.phone ?? '')
      })
      .catch(() => setError('Fehler beim Laden.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const body: Record<string, string> = { name, email, phone }
      if (newPassword) body.newPassword = newPassword
      const res = await fetch('/api/admin/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setError(d.error ?? 'Fehler beim Speichern.')
      } else {
        setNewPassword('')
        setSuccess('Erfolgreich gespeichert.')
        setTimeout(() => setSuccess(''), 4000)
      }
    } catch {
      setError('Netzwerkfehler.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mein Profil</h1>
          <p className="text-slate-500 text-sm mt-1">Persönliche Kontodaten bearbeiten</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors">
          <Save className="w-4 h-4" />
          {saving ? 'Speichern…' : 'Speichern'}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 mb-4 text-sm">{success}</div>}

      {/* Kontakt */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-5">Kontakt</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Name</label>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)}
              placeholder="Vor- und Nachname" />
          </div>
          <div>
            <label className={labelCls}>E-Mail-Adresse</label>
            <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="name@firma.de" />
            <p className="text-xs text-slate-400 mt-1">Wird für die Anmeldung verwendet.</p>
          </div>
          <div>
            <label className={labelCls}>Telefon <span className="text-slate-400 font-normal">(optional)</span></label>
            <input className={inputCls} type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+49 123 456789" />
          </div>
        </div>
      </div>

      {/* Passwort */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Passwort ändern</h2>
        <p className="text-sm text-slate-500 mb-5">Leer lassen, wenn das Passwort unverändert bleiben soll.</p>
        <div>
          <label className={labelCls}>Neues Passwort</label>
          <div className="relative">
            <input
              className={inputCls + ' pr-12'}
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pb-8">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors">
          <Save className="w-4 h-4" />
          {saving ? 'Speichern…' : 'Speichern'}
        </button>
      </div>
    </div>
  )
}
