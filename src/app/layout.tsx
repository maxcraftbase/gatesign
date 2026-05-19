import type { Metadata, Viewport } from 'next'
import './globals.css'

const SITE_URL = 'https://gatesign.de'
const TITLE = 'GateSign — Digitale Sicherheitsbelehrung & Check-In am Werkseingang'
const DESCRIPTION =
  'Rechtssichere Fahrer- und Besucheranmeldung in 10 Sprachen. ISO-Sicherheitsbelehrung, digitale Unterschrift und Anwesenheitsliste — DSGVO-konform, Server in der EU. 30 Tage kostenlos.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s · GateSign',
  },
  description: DESCRIPTION,
  manifest: '/manifest.json',
  applicationName: 'GateSign',
  authors: [{ name: 'Alpha Consult GmbH' }],
  keywords: [
    'Sicherheitsbelehrung digital',
    'Besucherregistrierung',
    'LKW Anmeldung Tablet',
    'Check-In Terminal',
    'Fahreranmeldung mehrsprachig',
    'DGUV Vorschrift 1',
    'ArbSchG § 12',
    'Werkseingang Pförtner',
    'Empfang Tablet',
    'GateSign',
  ],
  alternates: {
    canonical: '/',
    languages: {
      'de-DE': '/',
      'en-US': '/?lang=en',
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GateSign',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: SITE_URL,
    siteName: 'GateSign',
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'GateSign — Check-In Terminal',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/icon-512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'GateSign',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iPadOS, Android',
  description: DESCRIPTION,
  url: SITE_URL,
  inLanguage: ['de', 'en'],
  offers: [
    {
      '@type': 'Offer',
      name: 'Starter',
      price: '49.00',
      priceCurrency: 'EUR',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '49.00',
        priceCurrency: 'EUR',
        billingDuration: 'P1M',
        unitText: 'monthly',
      },
    },
    {
      '@type': 'Offer',
      name: 'Professional',
      price: '99.00',
      priceCurrency: 'EUR',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '99.00',
        priceCurrency: 'EUR',
        billingDuration: 'P1M',
        unitText: 'monthly',
      },
    },
  ],
  publisher: {
    '@type': 'Organization',
    name: 'Alpha Consult GmbH',
    url: SITE_URL,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col antialiased bg-slate-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}
