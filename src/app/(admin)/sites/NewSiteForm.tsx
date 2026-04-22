'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function NewSiteForm({ companyId }: { companyId: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.from('sites').insert({
      company_id: companyId,
      name: name.trim(),
      address: address.trim() || null,
    })

    if (error) {
      setError('Standort konnte nicht angelegt werden.')
      setLoading(false)
      return
    }

    setName('')
    setAddress('')
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Input
          label="Standortname"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="z. B. Werk Nord, Lager 2"
          required
        />
      </div>
      <div className="flex-1">
        <Input
          label="Adresse (optional)"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Musterstraße 1, 12345 Stadt"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" loading={loading} size="md" className="shrink-0 sm:mb-0">
        Anlegen
      </Button>
    </form>
  )
}
