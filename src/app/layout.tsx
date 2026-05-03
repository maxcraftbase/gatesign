import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GateSign — Kiosk Check-in',
  description: 'Digitale Fahreranmeldung am Empfang. Sicherheitsbelehrung. Unterschrift.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-full flex flex-col antialiased bg-slate-900">{children}</body>
    </html>
  )
}
