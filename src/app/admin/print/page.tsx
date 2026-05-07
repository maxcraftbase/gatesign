'use client'
import { useEffect } from 'react'

export default function PrintPage() {
  useEffect(() => {
    window.opener?.postMessage({ type: 'PRINT_READY' }, window.location.origin)

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'PDF' && e.data.buf instanceof ArrayBuffer) {
        const blob = new Blob([e.data.buf], { type: 'application/pdf' })
        // Navigate directly to blob URL — becomes Chrome's native PDF viewer.
        // Ctrl+P and w.print() from parent both work correctly this way.
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
