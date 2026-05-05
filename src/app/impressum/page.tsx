import Link from 'next/link'

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-100 h-14 flex items-center px-6">
        <Link href="/" className="text-lg font-bold text-slate-900 hover:opacity-70 transition-opacity">GateSign</Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Impressum</h1>

        <section className="space-y-6 text-slate-700 text-sm leading-relaxed">
          <div>
            <h2 className="font-semibold text-slate-900 mb-1">Angaben gemäß § 5 TMG</h2>
            <p>
              Alpha Consult GmbH<br />
              Domring 2<br />
              59581 Warstein
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900 mb-1">Handelsregister</h2>
            <p>
              Amtsgericht Arnsberg, HRB 13161<br />
              USt-IdNr.: DE 327 780 739
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900 mb-1">Geschäftsführung</h2>
            <p>Stefanie Rüther</p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900 mb-1">Kontakt</h2>
            <p>
              Telefon: +49 (0) 2902 60544-10<br />
              E-Mail: info@alpha-consult.one
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900 mb-1">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p>
              Stefanie Rüther<br />
              Domring 2, 59581 Warstein
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900 mb-1">Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer"
                className="text-slate-900 underline hover:opacity-70">
                https://ec.europa.eu/consumers/odr
              </a>.<br />
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900 mb-1">Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den
              allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
              verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu
              forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900 mb-1">Haftung für Links</h2>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
              Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
              verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            </p>
          </div>
        </section>

        <div className="mt-10 pt-6 border-t border-slate-100">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">← Zurück zur Startseite</Link>
        </div>
      </main>
    </div>
  )
}
