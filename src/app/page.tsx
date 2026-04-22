import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-bold text-xl text-slate-900">GateSign</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Anmelden
            </Link>
            <Link
              href="/register"
              className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors"
            >
              Kostenlos starten
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 text-sm px-3 py-1.5 rounded-full mb-8">
          Keine App. Kein Papier. Ein QR-Code.
        </div>
        <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
          Digitale Fahreranmeldung<br />in 15 Minuten live.
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
          Schluss mit Papierlisten am Tor. Fahrer scannen einen QR-Code, bestätigen die Sicherheitsbelehrung einmalig — und sind ab dem zweiten Besuch mit einem Klick angemeldet.
        </p>
        <Link
          href="/register"
          className="inline-flex bg-slate-900 text-white text-lg font-semibold px-8 py-4 rounded-2xl hover:bg-slate-700 transition-colors"
        >
          Jetzt kostenlos einrichten →
        </Link>
        <p className="text-sm text-slate-400 mt-4">Keine Kreditkarte zum Start. Setup in 15 Minuten.</p>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">So einfach funktioniert es</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'QR-Code erstellen', desc: 'Standort anlegen, Sicherheitsbelehrung hinterlegen, QR-Code drucken. In 15 Minuten.' },
              { step: '2', title: 'Fahrer scannt', desc: 'Kein App-Download. Browser öffnet sich automatisch. Erste Belehrung einmalig bestätigen.' },
              { step: '3', title: 'Nachweis digital', desc: 'Alle Check-ins mit Zeitstempel, Kennzeichen und Belehrungsbestätigung. Export per Knopfdruck.' },
            ].map(item => (
              <div key={item.step} className="bg-white rounded-2xl p-6 border border-slate-100">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 max-w-4xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Warum GateSign?</h2>
            <ul className="flex flex-col gap-4">
              {[
                'Papierlisten am Tor entfallen komplett',
                'Sicherheitsbelehrung rechtssicher digital dokumentiert',
                'Fahrer melden sich in Sekunden an',
                'Mehrsprachig — für internationale Fahrer',
                'Nachweis-Export für Audits und Kontrollen',
                'Keine App-Installation für Fahrer nötig',
              ].map(benefit => (
                <li key={benefit} className="flex items-start gap-3 text-slate-700">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-50 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">📋 → 📱</div>
            <p className="text-slate-500 text-sm">
              Das Formular &ldquo;Kenntnisnahme Sicherheitsanweisungen&rdquo; &mdash; digital, ohne Stift, ohne unlesbaren Handschriften.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Einfache Preise</h2>
          <p className="text-slate-500 mb-12">Pro Standort. Monatlich kündbar.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Starter', price: '59', features: ['1 Standort', '1 QR-Code', 'Nachweisliste', 'CSV-Export'] },
              { name: 'Professional', price: '99', features: ['1 Standort', 'Alle 10 Sprachen', 'PDF-Export', 'Belehrungsversionierung'], highlight: true },
              { name: 'Business', price: '149', features: ['Mehrere Standorte', 'Übergreifende Auswertung', 'Prioritäts-Support', 'Individuelles Angebot'] },
            ].map(tier => (
              <div
                key={tier.name}
                className={`rounded-2xl p-6 border text-left ${tier.highlight ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100'}`}
              >
                <p className={`text-sm font-medium mb-1 ${tier.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{tier.name}</p>
                <p className={`text-4xl font-bold mb-1 ${tier.highlight ? 'text-white' : 'text-slate-900'}`}>
                  {tier.price} €
                </p>
                <p className={`text-sm mb-6 ${tier.highlight ? 'text-slate-400' : 'text-slate-400'}`}>/ Standort / Monat</p>
                <ul className="flex flex-col gap-2 mb-6">
                  {tier.features.map(f => (
                    <li key={f} className={`text-sm flex items-center gap-2 ${tier.highlight ? 'text-slate-300' : 'text-slate-600'}`}>
                      <span className={tier.highlight ? 'text-green-400' : 'text-green-500'}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${
                    tier.highlight
                      ? 'bg-white text-slate-900 hover:bg-slate-100'
                      : 'bg-slate-900 text-white hover:bg-slate-700'
                  }`}
                >
                  Jetzt starten
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-sm text-slate-400">
          <span>GateSign — Digitale Fahreranmeldung</span>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-slate-600">Anmelden</Link>
            <Link href="/register" className="hover:text-slate-600">Registrieren</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
