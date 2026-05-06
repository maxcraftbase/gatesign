'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Trash2, ChevronDown, MailCheck, Plus, X } from 'lucide-react'

interface CompanyUser {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'member'
  status: 'pending' | 'active'
  created_at: string
  last_login_at: string | null
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  try { return new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso)) } catch { return iso }
}

export function UsersClient({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<CompanyUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [contactPersons, setContactPersons] = useState<string[]>([])
  const [newContactPerson, setNewContactPerson] = useState('')
  const [savingContacts, setSavingContacts] = useState(false)

  async function loadUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.users ?? [])
    } catch { setError('Fehler beim Laden') } finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadUsers() }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings?.contact_persons) {
          try { setContactPersons(JSON.parse(data.settings.contact_persons)) } catch { /* ignore */ }
        }
      }).catch(() => {})
  }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteError('')
    setInviteSuccess(false)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, name: inviteName || undefined, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) { setInviteError(data.error ?? 'Fehler'); return }
      setInviteSuccess(true)
      setInviteEmail('')
      setInviteName('')
      void loadUsers()
      setTimeout(() => setInviteSuccess(false), 4000)
    } catch { setInviteError('Netzwerkfehler') } finally { setInviting(false) }
  }

  async function handleRoleChange(id: string, role: 'admin' | 'member') {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
  }

  async function saveContactPersons(persons: string[]) {
    setSavingContacts(true)
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { contact_persons: JSON.stringify(persons) } }),
    }).catch(() => {})
    setSavingContacts(false)
  }

  function addContactPerson() {
    const trimmed = newContactPerson.trim()
    if (!trimmed) return
    const next = [...contactPersons, trimmed]
    setContactPersons(next)
    setNewContactPerson('')
    void saveContactPersons(next)
  }

  function removeContactPerson(i: number) {
    const next = contactPersons.filter((_, idx) => idx !== i)
    setContactPersons(next)
    void saveContactPersons(next)
  }

  async function handleResend(user: CompanyUser) {
    setResendingId(user.id)
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: user.name ?? undefined, role: user.role }),
      })
    } finally { setResendingId(null) }
  }

  async function handleRemove(id: string) {
    if (!confirm('Nutzer wirklich entfernen?')) return
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== id))
    else { const d = await res.json(); alert(d.error ?? 'Fehler') }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Nutzerverwaltung</h1>
        <p className="text-slate-500 text-sm mt-1">Mitarbeiter einladen und Rollen verwalten</p>
      </div>

      {/* Invite form */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Nutzer einladen</h2>
        {inviteSuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-2.5 mb-4 text-sm">Einladung gesendet.</div>}
        {inviteError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 mb-4 text-sm">{inviteError}</div>}
        <form onSubmit={handleInvite} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              placeholder="E-Mail-Adresse *"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
            />
            <input
              type="text" value={inviteName} onChange={e => setInviteName(e.target.value)}
              placeholder="Name (optional)"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
            />
          </div>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value as 'admin' | 'member')}
                className="appearance-none pl-4 pr-8 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900 bg-white">
                <option value="member">Mitarbeiter</option>
                <option value="admin">Admin</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button type="submit" disabled={inviting}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors">
              <UserPlus className="w-4 h-4" />
              {inviting ? 'Wird eingeladen…' : 'Einladen'}
            </button>
          </div>
          <p className="text-xs text-slate-400">Der Nutzer erhält eine Einladungsmail und kann sich dann einloggen.</p>
        </form>
      </div>

      {/* User list */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Alle Nutzer</h2>
        </div>
        {error && <div className="px-6 py-4 text-red-600 text-sm">{error}</div>}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map(user => (
              <div key={user.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-slate-600">{(user.name ?? user.email)[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name ?? user.email}</p>
                  <p className="text-xs text-slate-400 truncate">{user.name ? user.email : ''} {user.last_login_at ? `· Letzter Login: ${formatDate(user.last_login_at)}` : user.status === 'pending' ? '· Einladung ausstehend' : ''}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${user.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {user.status === 'pending' ? 'Ausstehend' : 'Aktiv'}
                  </span>
                  <div className="relative">
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user.id, e.target.value as 'admin' | 'member')}
                      className="appearance-none text-xs pl-3 pr-7 py-1.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-slate-900 font-medium"
                    >
                      <option value="member">Mitarbeiter</option>
                      <option value="admin">Admin</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {user.status === 'pending' && (
                    <button
                      onClick={() => handleResend(user)}
                      disabled={resendingId === user.id}
                      className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50 disabled:opacity-40"
                      aria-label="Einladung erneut senden">
                      <MailCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleRemove(user.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    aria-label="Entfernen">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ansprechpartner */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Ansprechpartner</h2>
          <p className="text-sm text-slate-500 mt-0.5">Werden beim Drucken eines Eintrags zur Auswahl angeboten — z.B. für welches Tor oder welche Abteilung.</p>
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-2 mb-4">
            {contactPersons.length === 0 && (
              <p className="text-sm text-slate-400 italic">Noch keine Ansprechpartner hinterlegt.</p>
            )}
            {contactPersons.map((person, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-sm font-medium text-slate-800">{person}</span>
                <button onClick={() => removeContactPerson(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
              placeholder="Name oder Funktion eingeben…"
              value={newContactPerson}
              onChange={e => setNewContactPerson(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addContactPerson() } }}
            />
            <button onClick={addContactPerson} disabled={savingContacts || !newContactPerson.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors">
              <Plus className="w-4 h-4" /> Hinzufügen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
