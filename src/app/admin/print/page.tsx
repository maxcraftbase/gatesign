'use client'
import { useEffect } from 'react'

export default function PrintPage() {
  useEffect(() => {
    // Tell opener we're ready to receive the PDF
    if (window.opener) {
      window.opener.postMessage({ type: 'PRINT_READY' }, window.location.origin)
    }

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'PDF' && e.data.buf instanceof ArrayBuffer) {
        const blob = new Blob([e.data.buf], { type: 'application/pdf' })
        // Same-origin blob URL — navigation works
        window.location.href = URL.createObjectURL(blob)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: 0, fontFamily: 'Arial, sans-serif', color: '#64748b', fontSize: '16px' }}>
      Dokument wird geladen…
    </div>
  )
}
