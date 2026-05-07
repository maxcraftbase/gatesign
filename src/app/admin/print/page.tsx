'use client'
import { useEffect, useState } from 'react'

export default function PrintPage() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    window.opener?.postMessage({ type: 'PRINT_READY' }, window.location.origin)

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'PDF' && e.data.buf instanceof ArrayBuffer) {
        const blob = new Blob([e.data.buf], { type: 'application/pdf' })
        setPdfUrl(URL.createObjectURL(blob))
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  if (!pdfUrl) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: 0, fontFamily: 'Arial, sans-serif', color: '#64748b', fontSize: '16px' }}>
        Dokument wird geladen…
      </div>
    )
  }

  return (
    <iframe
      src={pdfUrl}
      onLoad={() => setTimeout(() => window.print(), 500)}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
      title="Druckvorschau"
    />
  )
}
