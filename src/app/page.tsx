'use client'

import { useState } from 'react'
import Link from 'next/link'

const content = {
  de: {
    nav: { login: 'Anmelden', register: 'Jetzt starten' },
    hero: {
      title: 'Digitales Check-in Terminal',
      sub: 'Für Unternehmen mit Wareneingang und Lieferverkehr. Besucher und Fahrer selbst einchecken — sicher, schnell, in 10 Sprachen.',
      cta: 'Kostenlos testen',
      login: 'Bereits Kunde? Anmelden',
    },
    how: {
      title: 'So funktioniert GateSign',
      steps: [
        { icon: '⚙️', title: 'Einrichten', text: 'Sicherheitsregeln, Betriebszeiten und Belehrungstexte in wenigen Minuten konfigurieren.' },
        { icon: '📱', title: 'Terminal aufstellen', text: 'Tablet oder Touchscreen am Eingang platzieren — als PWA, kein App-Store nötig.' },
        { icon: '✅', title: 'Einchecken lassen', text: 'Besucher wählen Sprache, bestätigen Sicherheitsregeln, unterschreiben digital.' },
      ],
    },
    features: {
      title: 'Alles drin',
      items: [
        { icon: '🌍', text: '10 Sprachen (DE, EN, PL, RO, UA, TR, …)' },
        { icon: '🦺', text: 'Sicherheitsregeln mit ISO-Symbolen' },
        { icon: '📄', text: 'PDF-Belehrung je Besuchertyp' },
        { icon: '✍️', text: 'Digitale Unterschrift' },
        { icon: '📊', text: 'CSV-Export aller Check-ins' },
        { icon: '🕐', text: 'Betriebszeiten-Anzeige in Fahrersprache' },
      ],
    },
    pricing: {
      title: 'Einfache Preisgestaltung',
      price: '69',
      period: 'pro Monat & Standort',
      desc: 'Keine Einrichtungsgebühr. Keine Nutzungsabrechnung. Jederzeit kündbar.',
      cta: 'Jetzt starten',
    },
    footer: {
      rights: '© 2025 Alpha Consult GmbH · GateSign',
      impressum: 'Impressum',
      datenschutz: 'Datenschutz',
    },
  },
  en: {
    nav: { login: 'Log in', register: 'Get started' },
    hero: {
      title: 'Digital Check-in Terminal',
      sub: 'For businesses with inbound deliveries and logistics traffic. Visitors and drivers check in themselves — safe, fast, in 10 languages.',
      cta: 'Try for free',
      login: 'Already a customer? Log in',
    },
    how: {
      title: 'How GateSign works',
      steps: [
        { icon: '⚙️', title: 'Set up', text: 'Configure safety rules, opening hours and briefing texts in minutes.' },
        { icon: '📱', title: 'Place terminal', text: 'Mount a tablet or touchscreen at your entrance — as a PWA, no app store needed.' },
        { icon: '✅', title: 'Let visitors check in', text: 'Visitors choose their language, confirm safety rules and sign digitally.' },
      ],
    },
    features: {
      title: 'Everything included',
      items: [
        { icon: '🌍', text: '10 languages (DE, EN, PL, RO, UA, TR, …)' },
        { icon: '🦺', text: 'Safety rules with ISO symbols' },
        { icon: '📄', text: 'PDF briefing per visitor type' },
        { icon: '✍️', text: 'Digital signature' },
        { icon: '📊', text: 'CSV export of all check-ins' },
        { icon: '🕐', text: 'Opening hours in the driver\'s language' },
      ],
    },
    pricing: {
      title: 'Simple pricing',
      price: '69',
      period: 'per month & location',
      desc: 'No setup fee. No usage billing. Cancel anytime.',
      cta: 'Get started',
    },
    footer: {
      rights: '© 2025 Alpha Consult GmbH · GateSign',
      impressum: 'Impressum',
      datenschutz: 'Privacy Policy',
    },
  },
}

export default function LandingPage() {
  const [lang, setLang] = useState<'de' | 'en'>('de')
  const t = content[lang]

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">GateSign</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'de' ? 'en' : 'de')}
              className="text-sm text-slate-400 hover:text-slate-700 transition-colors font-medium px-2"
            >
              {lang === 'de' ? 'EN' : 'DE'}
            </button>
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">
              {t.nav.login}
            </Link>
            <Link href="/register"
              className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors font-medium">
              {t.nav.register}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight leading-tight mb-5">
          {t.hero.title}
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t.hero.sub}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register"
            className="inline-block bg-slate-900 text-white text-base font-semibold px-8 py-4 rounded-xl hover:bg-slate-700 transition-colors">
            {t.hero.cta} →
          </Link>
          <Link href="/login"
            className="inline-block text-slate-500 text-base font-medium px-8 py-4 rounded-xl hover:text-slate-900 hover:bg-slate-50 transition-colors">
            {t.hero.login}
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-center mb-12">{t.how.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {t.how.steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl mb-4">{step.icon}</div>
              <div className="text-sm font-semibold text-slate-400 mb-1">Schritt {i + 1}</div>
              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20 bg-slate-50 rounded-3xl my-8">
        <h2 className="text-2xl font-bold text-center mb-10">{t.features.title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {t.features.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-5 py-4 border border-slate-100">
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <span className="text-sm text-slate-700 font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold mb-10">{t.pricing.title}</h2>
        <div className="inline-block bg-white border border-slate-200 rounded-2xl shadow-sm p-10 max-w-sm w-full">
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-5xl font-bold">€{t.pricing.price}</span>
          </div>
          <p className="text-slate-400 text-sm mb-6">{t.pricing.period}</p>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">{t.pricing.desc}</p>
          <Link href="/register"
            className="block w-full bg-slate-900 text-white font-semibold py-4 rounded-xl hover:bg-slate-700 transition-colors">
            {t.pricing.cta}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
          <span>{t.footer.rights}</span>
          <div className="flex gap-5">
            <Link href="/impressum" className="hover:text-slate-600 transition-colors">{t.footer.impressum}</Link>
            <Link href="/datenschutz" className="hover:text-slate-600 transition-colors">{t.footer.datenschutz}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
