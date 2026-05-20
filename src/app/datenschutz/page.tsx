import Link from 'next/link'

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-100 h-14 flex items-center px-6">
        <Link href="/" className="text-lg font-bold text-slate-900 hover:opacity-70 transition-opacity">GateSign</Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Datenschutzerklärung &amp; Nutzungsbedingungen</h1>
        <p className="text-xs text-slate-400 mb-8">Stand: Mai 2026</p>

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
            <h2 className="font-semibold text-slate-900 mb-2">3. Zweck der Verarbeitung &amp; Auftragsverarbeitung</h2>
            <p>
              Die Daten werden ausschließlich zur Bereitstellung des GateSign Check-in-Dienstes verarbeitet.
              Check-in-Daten (Name, Kennzeichen, Unterschrift, Zeitstempel) werden im Auftrag der jeweiligen
              Kundenunternehmen gespeichert und verarbeitet — diese sind Verantwortliche im Sinne der DSGVO,
              GateSign ist Auftragsverarbeiter (Art. 28 DSGVO).
            </p>
            <p className="mt-2">
              Mit jedem Kundenunternehmen wird vor Aktivierung des Accounts ein Auftragsverarbeitungsvertrag
              (AVV) gemäß Art. 28 DSGVO geschlossen. Der unterzeichnete AVV ist im Admin-Bereich des
              jeweiligen Kunden als PDF abrufbar.
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
              Check-in-Daten werden maximal <strong>2 Jahre</strong> nach Erfassung gespeichert. Die Frist orientiert
              sich an der Verjährung für Ordnungswidrigkeiten (§ 31 OWiG) im Zusammenhang mit der
              Dokumentationspflicht nach § 12 ArbSchG. Eine frühere Löschung durch das verantwortliche
              Kundenunternehmen ist jederzeit möglich.
            </p>
            <p className="mt-2">
              Account-Stammdaten (Firmenname, E-Mail, Login-Daten) werden für die Dauer des Vertragsverhältnisses
              gespeichert und nach Vertragsende innerhalb von 90 Tagen gelöscht, soweit keine gesetzlichen
              Aufbewahrungspflichten (§ 147 AO, § 257 HGB) entgegenstehen.
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

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Nutzungsbedingungen</h2>
          <p className="text-xs text-slate-400 mb-6">Auszug — gelten ergänzend zum jeweiligen Auftragsverarbeitungsvertrag (AVV).</p>

          <div className="space-y-8 text-slate-700 text-sm leading-relaxed">
            <section>
              <h3 className="font-semibold text-slate-900 mb-2">A. Leistungsumfang</h3>
              <p>
                GateSign stellt eine cloudbasierte Software zur Erfassung von Besuchern, Fahrern und
                Dienstleistern am Empfang bereit (Check-in Terminal, Admin-Dashboard, Sicherheitsbelehrungen,
                Protokollierung). Die Bereitstellung erfolgt im Abonnement nach den jeweils gewählten Tarifen.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">B. Signaturen am Terminal</h3>
              <p>
                Die am Terminal abgegebenen Unterschriften (Touchscreen-Erfassung als Pixelbild) sind
                <strong> einfache elektronische Signaturen</strong> im Sinne von Art. 3 Nr. 10 eIDAS-Verordnung.
                Sie sind <strong>keine qualifizierten elektronischen Signaturen</strong> (QES) und ersetzen
                eine Schriftform im Sinne von § 126 BGB nicht.
              </p>
              <p className="mt-2">
                Für die Dokumentation der Sicherheitsunterweisung nach § 12 ArbSchG sowie für interne
                Empfangs- und Zutrittsnachweise ist die einfache elektronische Signatur ausreichend.
                Für rechtsgeschäftliche Erklärungen, die der gesetzlichen Schriftform unterliegen, ist die
                Lösung nicht vorgesehen.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">C. KI-gestützte Übersetzungen</h3>
              <p>
                GateSign bietet eine automatische Übersetzung kundeneigener Inhalte (z. B. Sicherheitshinweise)
                in bis zu 10 Sprachen über externe KI- und Übersetzungsdienste (u. a. DeepL).
                Maschinelle Übersetzungen können <strong>fehlerhaft, unvollständig oder missverständlich</strong> sein.
              </p>
              <p className="mt-2">
                Die <strong>Verantwortung für die Prüfung und Freigabe der übersetzten Inhalte</strong> liegt
                ausschließlich beim Kunden. GateSign übernimmt keine Haftung für inhaltliche Richtigkeit
                oder rechtliche Wirksamkeit maschineller Übersetzungen. Vor Veröffentlichung empfehlen wir
                eine fachliche Kontrolle durch eine sprachkundige Person.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">D. Verantwortlichkeit für Inhalte</h3>
              <p>
                Der Kunde ist allein verantwortlich für die Rechtmäßigkeit, Richtigkeit und Aktualität aller
                über GateSign verarbeiteten Inhalte (Sicherheitsbelehrung, Hausordnung, Ansprechpartner,
                Dokumente). GateSign prüft Kundeninhalte nicht inhaltlich.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">E. Verfügbarkeit</h3>
              <p>
                GateSign strebt eine hohe Verfügbarkeit an, gewährt jedoch keine garantierte Uptime. Wartungs-
                und Aktualisierungsarbeiten werden, soweit möglich, außerhalb der typischen Geschäftszeiten
                durchgeführt.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">F. Haftung</h3>
              <p>
                Die Haftung von GateSign richtet sich nach den gesetzlichen Vorschriften. Für leichte
                Fahrlässigkeit haftet GateSign nur bei Verletzung vertragswesentlicher Pflichten
                (Kardinalpflichten) und der Höhe nach begrenzt auf den vertragstypisch vorhersehbaren Schaden.
                Die Haftung für Vorsatz, grobe Fahrlässigkeit, Personenschäden und nach dem
                Produkthaftungsgesetz bleibt unberührt.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">← Zurück zur Startseite</Link>
        </div>
      </main>
    </div>
  )
}
