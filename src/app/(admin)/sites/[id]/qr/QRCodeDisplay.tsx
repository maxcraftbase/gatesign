'use client'
import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Download, Printer, Copy, Check } from 'lucide-react'

export function QRCodeDisplay({ url, siteName }: { url: string; siteName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 280,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
    }
  }, [url])

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `gatesign-qr-${siteName.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  function handlePrint() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL()
    const win = window.open('')
    if (!win) return
    win.document.write(`
      <html><head><title>GateSign QR-Code — ${siteName}</title>
      <style>
        body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
        h2 { margin-bottom: 12px; color: #0f172a; }
        p { color: #64748b; font-size: 14px; margin-top: 12px; }
      </style></head>
      <body>
        <h2>${siteName}</h2>
        <img src="${dataUrl}" width="300" />
        <p>GateSign — Digitale Fahreranmeldung</p>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body></html>
    `)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="flex flex-col items-center gap-6">
      <canvas ref={canvasRef} className="rounded-xl" />

      <div className="flex gap-3">
        <Button onClick={handleDownload} variant="primary" size="md">
          <Download size={16} className="mr-2" />
          Herunterladen
        </Button>
        <Button onClick={handlePrint} variant="secondary" size="md">
          <Printer size={16} className="mr-2" />
          Drucken
        </Button>
      </div>

      <div className="flex items-center gap-2 w-full max-w-sm">
        <p className="text-xs text-slate-400 truncate flex-1">{url}</p>
        <button
          onClick={handleCopy}
          className="shrink-0 text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          {copied ? 'Kopiert' : 'Kopieren'}
        </button>
      </div>
    </Card>
  )
}
