'use client'
import { useEffect } from 'react'

export default function PrintPage() {
  useEffect(() => {
    const printKey = new URLSearchParams(window.location.search).get('k')
    if (!printKey) return

    const load = () => {
      const b64 = localStorage.getItem(printKey)
      if (!b64) return false
      localStorage.removeItem(printKey)
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: 'application/pdf' })
      window.location.href = URL.createObjectURL(blob)
      return true
    }

    if (!load()) {
      const interval = setInterval(() => { if (load()) clearInterval(interval) }, 200)
      setTimeout(() => clearInterval(interval), 30_000)
      return () => clearInterval(interval)
    }
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: 0, fontFamily: 'Arial, sans-serif', color: '#64748b', fontSize: '16px' }}>
      Dokument wird geladen…
    </div>
  )
}
