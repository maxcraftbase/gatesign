'use client'
import { useEffect, useState } from 'react'

export default function PrintPage() {
  const [blobUrl, setBlobUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const printKey = new URLSearchParams(window.location.search).get('k')
    if (!printKey) return

    const load = () => {
      const item = localStorage.getItem(printKey)
      if (!item) return false
      localStorage.removeItem(printKey)
      if (item.startsWith('error:')) {
        setError(item.slice(6))
        return true
      }
      setBlobUrl(item)
      return true
    }

    if (!load()) {
      const interval = setInterval(() => { if (load()) clearInterval(interval) }, 200)
      setTimeout(() => clearInterval(interval), 60_000)
      return () => clearInterval(interval)
    }
  }, [])

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: 0, fontFamily: 'Arial, sans-serif', gap: '8px' }}>
        <span style={{ color: '#ef4444', fontSize: '16px' }}>Fehler beim Erstellen des Dokuments.</span>
        <span style={{ color: '#94a3b8', fontSize: '13px' }}>{error}</span>
      </div>
    )
  }

  if (blobUrl) {
    return (
      <iframe
        src={blobUrl}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        onLoad={() => { window.print() }}
      />
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: 0, fontFamily: 'Arial, sans-serif', color: '#64748b', fontSize: '16px' }}>
      Dokument wird geladen…
    </div>
  )
}
