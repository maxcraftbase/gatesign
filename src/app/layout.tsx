import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GateSign — Digitale Fahreranmeldung',
  description: 'QR-Check-in für Lieferverkehr. Papierlos. Einfach. Rechtssicher.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  )
}
