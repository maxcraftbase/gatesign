'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export function SubscribeButton() {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    if (!res.ok) { setLoading(false); return }
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  return (
    <Button onClick={handleSubscribe} loading={loading} size="md">
      Jetzt abonnieren — 99 €/Monat
    </Button>
  )
}
