'use client'
import { useEffect, useState } from 'react'

export default function PrintPage() {
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
      // Tell parent we're about to navigate so it can time w.print() after hydration
      try { window.opener?.postMessage({ type: 'gs-print-nav', key: printKey }, location.origin) } catch {}
      window.location.href = item
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

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: 0, fontFamily: 'Arial, sans-serif', color: '#64748b', fontSize: '16px' }}>
      Dokument wird geladen…
    </div>
  )
}
