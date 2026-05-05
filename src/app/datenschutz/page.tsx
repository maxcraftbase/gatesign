import Link from 'next/link'

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-100 h-14 flex items-center px-6">
        <Link href="/" className="text-lg font-bold text-slate-900 hover:opacity-70 transition-opacity">GateSign</Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Datenschutzerklärung</h1>
        <p className="text-xs text-slate-400 mb-8">Stand: März 2025</p>

        <div className="space-y-8 text-slate-700 text-sm leading-relaxed">
          <section>
            <h2 className="font-semibold text-slate-900 mb-2">1. Verantwortlicher</h2>
            <p>
              Alpha Consult GmbH<br />
              Domring 2, 59581 Warstein<br />
              E-Mail: info@alpha-consult.one
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">2. Erhebung und Verarbeitung personenbezogener Daten</h2>
            <p>
              Wir erheben und verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung unserer
              Dienstleistung erforderlich ist. Dies umfasst:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Firmendaten bei der Registrierung (Firmenname, E-Mail-Adresse)</li>
              <li>Check-in-Daten, die über das Terminal erfasst werden (Name, Fahrzeugkennzeichen, Unterschrift)</li>
              <li>Server-Logdaten (IP-Adresse, Browserinformationen, Zeitstempel)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">3. Zweck der Verarbeitung</h2>
            <p>
              Die Daten werden ausschließlich zur Bereitstellung des GateSign Check-in-Dienstes verarbeitet.
              Check-in-Daten werden im Auftrag der jeweiligen Unternehmen gespeichert und verarbeitet
              (Auftragsverarbeitung gemäß Art. 28 DSGVO).
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">4. Hosting und Infrastruktur</h2>
            <p>
              Die Anwendung wird auf Servern von Railway (USA) betrieben. Datenbankdienste werden über
              Supabase bereitgestellt. Die Übertragung in Drittländer erfolgt auf Basis geeigneter
              Garantien gemäß Art. 46 DSGVO (Standardvertragsklauseln).
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">5. E-Mail-Kommunikation</h2>
            <p>
              Transaktions-E-Mails (z. B. Registrierungsbestätigung) werden über den Dienst Brevo
              (Sendinblue SAS, Frankreich) versendet.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">6. Cookies</h2>
            <p>
              Wir verwenden ausschließlich technisch notwendige Cookies für Session-Verwaltung und
              Authentifizierung. Es werden keine Analyse- oder Marketing-Cookies eingesetzt.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">7. Speicherdauer</h2>
            <p>
              Personenbezogene Daten werden nur so lange gespeichert, wie es für den jeweiligen Zweck
              erforderlich ist. Check-in-Daten können von den jeweiligen Unternehmen jederzeit gelöscht werden.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">8. Ihre Rechte</h2>
            <p>Sie haben das Recht auf:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
            </ul>
            <p className="mt-2">
              Zur Geltendmachung Ihrer Rechte wenden Sie sich an: info@alpha-consult.one
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">9. Beschwerderecht</h2>
            <p>
              Sie haben das Recht, sich bei der zuständigen Aufsichtsbehörde zu beschweren. In NRW ist dies
              die Landesbeauftragte für Datenschutz und Informationsfreiheit:{' '}
              <a href="https://www.ldi.nrw.de" target="_blank" rel="noopener noreferrer"
                className="text-slate-900 underline hover:opacity-70">
                www.ldi.nrw.de
              </a>
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">← Zurück zur Startseite</Link>
        </div>
      </main>
    </div>
  )
}
