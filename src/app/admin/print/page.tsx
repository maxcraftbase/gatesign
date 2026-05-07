'use client'
import { useEffect } from 'react'

export default function PrintPage() {
  useEffect(() => {
    const channelName = window.location.hash.slice(1)
    if (!channelName) return

    const bc = new BroadcastChannel(channelName)
    bc.postMessage({ type: 'PRINT_READY' })

    bc.onmessage = (e) => {
      if (e.data?.type === 'PDF' && e.data.buf instanceof ArrayBuffer) {
        const blob = new Blob([e.data.buf], { type: 'application/pdf' })
        window.location.href = URL.createObjectURL(blob)
        bc.close()
      }
    }

    return () => bc.close()
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: 0, fontFamily: 'Arial, sans-serif', color: '#64748b', fontSize: '16px' }}>
      Dokument wird geladen…
    </div>
  )
}
