'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Trash2, ChevronDown } from 'lucide-react'

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

  async function loadUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.users ?? [])
    } catch { setError('Fehler beim Laden') } finally { setLoading(false) }
  }

  useEffect(() => { void loadUsers() }, [])

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
                  <button onClick={() => handleRemove(user.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    title="Entfernen">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
