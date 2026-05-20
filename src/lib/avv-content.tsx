/**
 * AVV (Auftragsverarbeitungsvertrag) nach Art. 28 DSGVO.
 * Wird sowohl auf der öffentlichen /avv-Seite als auch im
 * Onboarding-Signaturflow verwendet.
 */

export const AVV_VERSION = '1.0'
export const AVV_DATE = 'Mai 2026'

export interface AvvController {
  companyName: string
  address?: string
  registerInfo?: string
  signerName?: string
  signerRole?: string
}

const PROCESSOR = {
  legalName: 'Alpha Consult GmbH',
  product: 'GateSign',
  address: 'Domring 2, 59581 Warstein, Deutschland',
  register: 'Amtsgericht Arnsberg, HRB 13161',
  email: 'info@alpha-consult.one',
  contactDp: 'info@alpha-consult.one',
}

function ControllerBlock({ controller }: { controller?: AvvController }) {
  if (!controller) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm leading-relaxed">
        <p className="font-semibold text-slate-900 mb-1">Verantwortlicher (Kunde)</p>
        <p className="text-slate-500">
          Das jeweilige Kundenunternehmen, das den AVV im Rahmen der Account-Einrichtung
          elektronisch angenommen hat. Die konkreten Daten werden in der unterzeichneten
          Fassung im Admin-Bereich des Kunden hinterlegt.
        </p>
      </div>
    )
  }
  const extras = [controller.address, controller.registerInfo].filter(Boolean)
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm leading-relaxed">
      <p className="font-semibold text-slate-900 mb-1">Verantwortlicher (Kunde)</p>
      <p>
        {controller.companyName}
        {extras.length > 0 && <><br />{extras.join(' · ')}</>}
        {controller.signerName ? <><br />vertreten durch: {controller.signerName}{controller.signerRole ? `, ${controller.signerRole}` : ''}</> : null}
      </p>
    </div>
  )
}

function ProcessorBlock() {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm leading-relaxed">
      <p className="font-semibold text-slate-900 mb-1">Auftragsverarbeiter (GateSign)</p>
      <p>
        {PROCESSOR.legalName}<br />
        {PROCESSOR.address}<br />
        {PROCESSOR.register}<br />
        Kontakt: {PROCESSOR.email}
      </p>
    </div>
  )
}

export function AvvDocument({ controller }: { controller?: AvvController }) {
  return (
    <div className="space-y-8 text-slate-700 text-sm leading-relaxed">
      <div className="grid sm:grid-cols-2 gap-4">
        <ControllerBlock controller={controller} />
        <ProcessorBlock />
      </div>

      <section>
        <h2 className="font-semibold text-slate-900 mb-2">Präambel</h2>
        <p>
          Der Verantwortliche nutzt die Software „{PROCESSOR.product}“ der {PROCESSOR.legalName}{' '}
          (nachfolgend „Auftragsverarbeiter“) zur Erfassung und Dokumentation von Check-ins
          am Empfang. Hierbei werden im Auftrag des Verantwortlichen personenbezogene Daten
          verarbeitet. Die Parteien schließen diesen Auftragsverarbeitungsvertrag (AVV) zur
          Erfüllung der Anforderungen nach Art. 28 DSGVO.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 mb-2">§ 1 Gegenstand und Dauer des Auftrags</h2>
        <p>
          Gegenstand des Auftrags ist die Bereitstellung und der Betrieb der Check-in-Software
          GateSign zur Erfassung von Besucherinnen und Besuchern, Fahrerinnen und Fahrern sowie
          Dienstleisterinnen und Dienstleistern, einschließlich Dokumentation der
          Sicherheitsunterweisung und Speicherung der erhobenen Daten im Admin-Bereich des
          Verantwortlichen.
        </p>
        <p className="mt-2">
          Die Vereinbarung wird auf unbestimmte Zeit geschlossen und endet mit Beendigung des
          zugrundeliegenden Hauptvertrages über die Nutzung von GateSign.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 mb-2">§ 2 Art, Umfang und Zweck der Verarbeitung</h2>
        <p>
          Die Verarbeitung dient der Erfassung, Speicherung, Anzeige und Bereitstellung von
          Check-in-Daten zur Sicherheits- und Zutrittsdokumentation des Verantwortlichen,
          insbesondere zur Erfüllung der Dokumentationspflicht nach § 12 ArbSchG sowie zur
          Wahrnehmung des berechtigten Interesses an der Kontrolle des Werks- und
          Betriebsgeländes (Art. 6 Abs. 1 lit. c und f DSGVO). Eine Verarbeitung außerhalb dieses
          Zwecks erfolgt nicht.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 mb-2">§ 3 Art der Daten und Kategorien betroffener Personen</h2>
        <p>Verarbeitet werden insbesondere folgende Datenkategorien (vgl. Anlage 3):</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Stammdaten (Vor- und Nachname, ggf. Firma/Spedition, ggf. Kontaktdaten)</li>
          <li>Fahrzeugdaten (Kennzeichen, Anhängerkennzeichen, Referenz-/Auftragsnummer)</li>
          <li>Bestätigungs- und Dokumentationsdaten (Unterschrift als Pixelbild, Zeitstempel, Sprache, Bestätigung der Sicherheitsbelehrung)</li>
          <li>Optionale Notizen, Ansprechpartner-Zuordnung, Ein- und Auschecks</li>
          <li>Technische Daten zur Sicherheit (IP-Adresse, Browser-/Geräte-Informationen, Logdaten)</li>
        </ul>
        <p className="mt-2">
          Kategorien betroffener Personen: Besucherinnen und Besucher, Fahrerinnen und Fahrer,
          Dienstleisterinnen und Dienstleister sowie Mitarbeitende des Verantwortlichen
          (Empfangs- und Verwaltungspersonal).
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 mb-2">§ 4 Rechte und Pflichten des Verantwortlichen</h2>
        <p>
          Der Verantwortliche ist im Sinne von Art. 4 Nr. 7 DSGVO allein verantwortlich für die
          Zulässigkeit der Verarbeitung und für die Wahrung der Rechte der betroffenen Personen.
          Weisungen erfolgen grundsätzlich in Textform; mündliche Weisungen werden vom
          Auftragsverarbeiter unverzüglich in Textform bestätigt. Eine Liste weisungsberechtigter
          Personen wird beim Verantwortlichen geführt.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 mb-2">§ 5 Allgemeine Pflichten des Auftragsverarbeiters</h2>
        <p>Der Auftragsverarbeiter verpflichtet sich insbesondere zu:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Verarbeitung der Daten ausschließlich im Rahmen der Weisungen des Verantwortlichen;</li>
          <li>schriftliche Information des Verantwortlichen, wenn er der Auffassung ist, dass eine Weisung gegen geltendes Datenschutzrecht verstößt;</li>
          <li>Gestaltung der internen Organisation derart, dass sie den besonderen Anforderungen des Datenschutzes gerecht wird;</li>
          <li>Umsetzung der in Anlage 1 vereinbarten technischen und organisatorischen Maßnahmen;</li>
          <li>Bereitstellung der zum Nachweis der Einhaltung der Pflichten aus Art. 28 DSGVO erforderlichen Informationen.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 mb-2">§ 6 Vertraulichkeit</h2>
        <p>
          Der Auftragsverarbeiter setzt zur Verarbeitung der Daten nur Beschäftigte und
          Subunternehmer ein, die auf die Vertraulichkeit verpflichtet wurden und mit den
          maßgeblichen Datenschutzbestimmungen vertraut sind. Die Verpflichtung wirkt auch nach
          Beendigung der Tätigkeit fort.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 mb-2">§ 7 Technische und organisatorische Maßnahmen</h2>
        <p>
          Der Auftragsverarbeiter trifft die in <strong>Anlage 1</strong> beschriebenen
          technischen und organisatorischen Maßnahmen nach Art. 32 DSGVO und gewährleistet ein
          dem Risiko angemessenes Schutzniveau. Änderungen sind möglich, sofern das Schutzniveau
          erhalten bleibt; wesentliche Änderungen werden dem Verantwortlichen mitgeteilt.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 mb-2">§ 8 Inanspruchnahme weiterer Auftragsverarbeiter (Subunternehmer)</h2>
        <p>
          Der Verantwortliche erteilt dem Auftragsverarbeiter mit Abschluss dieses AVV die
          allgemeine Genehmigung zur Inanspruchnahme der in <strong>Anlage 2</strong>
          aufgeführten Subunternehmer. Der Auftragsverarbeiter wird den Verantwortlichen über
          beabsichtigte Änderungen der Liste informieren. Der Verantwortliche kann der
          Beauftragung neuer Subunternehmer innerhalb von 14 Tagen aus wichtigem Grund
          widersprechen.
        </p>
        <p className="mt-2">
          Mit allen Subunternehmern werden Verträge geschlossen, die den Anforderungen des
          Art. 28 DSGVO entsprechen. Bei Übermittlung in Drittländer werden geeignete Garantien
          (insbesondere Standardvertragsklauseln gemäß Art. 46 Abs. 2 lit. c DSGVO) sichergestellt.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 mb-2">§ 9 Unterstützung bei Betroffenenrechten</h2>
        <p>
          Der Auftragsverarbeiter unterstützt den Verantwortlichen im Rahmen seiner Möglichkeiten
          bei der Erfüllung der Rechte der betroffenen Personen (Art. 12 bis 22 DSGVO). Der
          Admin-Bereich enthält Funktionen zur Auskunft, Löschung und zum Export der erfassten
          Daten.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 mb-2">§ 10 Mitteilungspflichten bei Datenschutzverletzungen</h2>
        <p>
          Der Auftragsverarbeiter meldet dem Verantwortlichen Verletzungen des Schutzes
          personenbezogener Daten unverzüglich, spätestens innerhalb von 24 Stunden nach
          Kenntniserlangung. Die Meldung enthält die Informationen nach Art. 33 Abs. 3 DSGVO,
          soweit verfügbar.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 mb-2">§ 11 Datenschutz-Folgenabschätzung</h2>
        <p>
          Der Auftragsverarbeiter unterstützt den Verantwortlichen bei einer eventuell
          erforderlichen Datenschutz-Folgenabschätzung gemäß Art. 35 DSGVO und einer vorherigen
          Konsultation der Aufsichtsbehörde gemäß Art. 36 DSGVO im erforderlichen Umfang.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 mb-2">§ 12 Weisungsrecht des Verantwortlichen</h2>
        <p>
          Der Verantwortliche ist im Rahmen der vertraglich vereinbarten Leistungen jederzeit
          berechtigt, Weisungen über Art, Umfang und Verfahren der Datenverarbeitung zu erteilen.
          Weisungen können nach diesem AVV ergänzt, geändert oder ersetzt werden.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 mb-2">§ 13 Löschung und Rückgabe von Daten</h2>
        <p>
          Check-in-Daten werden für die Dauer von maximal 2 Jahren ab Erfassung gespeichert
          (vgl. Datenschutzerklärung § 7). Auf Verlangen des Verantwortlichen werden Daten
          früher gelöscht. Nach Beendigung des Hauptvertrages werden sämtliche im Auftrag
          verarbeiteten Daten innerhalb von 90 Tagen gelöscht, sofern keine gesetzlichen
          Aufbewahrungspflichten entgegenstehen. Auf Wunsch erfolgt zuvor eine Übergabe in einem
          gängigen, maschinenlesbaren Format (CSV/JSON).
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 mb-2">§ 14 Kontrollrechte des Verantwortlichen</h2>
        <p>
          Der Verantwortliche überzeugt sich vor Aufnahme der Datenverarbeitung und sodann
          regelmäßig von der Einhaltung der technischen und organisatorischen Maßnahmen. Der
          Auftragsverarbeiter stellt hierzu auf Anfrage geeignete Nachweise zur Verfügung. Vor-Ort-
          Kontrollen sind nach vorheriger Abstimmung zu üblichen Geschäftszeiten möglich.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 mb-2">§ 15 Haftung</h2>
        <p>
          Für die Haftung der Parteien gilt Art. 82 DSGVO. Im Innenverhältnis haftet jede Partei
          für Schäden, die durch ihr Verschulden entstanden sind, im Umfang ihres Verursachungs-
          und Verschuldensanteils.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 mb-2">§ 16 Schlussbestimmungen</h2>
        <p>
          Änderungen und Ergänzungen dieses Vertrages bedürfen der Textform. Sollte eine
          Bestimmung dieses Vertrages unwirksam sein oder werden, bleibt die Wirksamkeit der
          übrigen Bestimmungen unberührt. Es gilt deutsches Recht; ausschließlicher Gerichts-
          stand ist – soweit gesetzlich zulässig – der Sitz des Auftragsverarbeiters.
        </p>
      </section>

      <div className="mt-12 pt-8 border-t border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Anlage 1 — Technische und organisatorische Maßnahmen (Art. 32 DSGVO)</h2>
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">1. Vertraulichkeit</h3>
            <p>
              Zutritts- und Zugangskontrolle der Rechenzentren der Subunternehmer (Sicherheitspersonal,
              Vereinzelungsanlagen, 24/7-Überwachung). Zugriffskontrolle über rollenbasierte
              Berechtigungen (Admin / Member), Multi-Tenant-Isolation auf Datenbankebene
              (Row Level Security, Company-Scope). Trennungskontrolle pro Mandant (company_id).
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">2. Integrität</h3>
            <p>
              Weitergabekontrolle durch TLS 1.2+ bei jeder Datenübertragung. Eingabekontrolle
              durch Audit-Log (wer hat wann welche Aktion ausgeführt). Hash-basierte
              Versionierung der Sicherheitsbelehrungen.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">3. Verfügbarkeit und Belastbarkeit</h3>
            <p>
              Hosting in einem ISO-27001-zertifizierten Rechenzentrum (Region EU). Tägliche
              automatisierte Datenbank-Backups, Wiederherstellungspunkt-Ziel ≤ 24 Stunden.
              Monitoring der Anwendung in Echtzeit (Error Tracking, Logs).
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">4. Pseudonymisierung und Verschlüsselung</h3>
            <p>
              Passwörter werden ausschließlich als bcrypt-Hash gespeichert. Datenbankzugang nur
              über JWT-basierte Authentifizierung. Verschlüsselung der Daten at-rest in der
              Supabase-Postgres-Instanz.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">5. Verfahren zur regelmäßigen Überprüfung</h3>
            <p>
              Vierteljährliche Überprüfung der Subunternehmer-Verträge, jährliche Aktualisierung
              der TOM. Kontinuierliches Sicherheits-Monitoring durch Sentry. TypeScript-basierte
              Eingabevalidierung (Zod) für alle API-Endpunkte.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">6. Auftragskontrolle</h3>
            <p>
              Sämtliche eingesetzten Subunternehmer wurden vor Beauftragung auf Eignung geprüft;
              mit allen bestehen Verträge mit Datenschutzklauseln entsprechend Art. 28 DSGVO.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Anlage 2 — Genehmigte Subunternehmer</h2>
        <p className="mb-4">
          Der Verantwortliche genehmigt mit Abschluss dieses AVV die folgenden Subunternehmer.
          Sämtliche Verarbeitungen erfolgen in der EU oder unter geeigneten Garantien gemäß
          Art. 46 DSGVO (Standardvertragsklauseln).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Subunternehmer</th>
                <th className="text-left px-3 py-2 font-semibold">Leistung</th>
                <th className="text-left px-3 py-2 font-semibold">Sitz / Region</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-3 py-2 align-top">Railway Corp.</td>
                <td className="px-3 py-2 align-top">Hosting der Webanwendung</td>
                <td className="px-3 py-2 align-top">USA (Server-Region EU West, Amsterdam) — SCCs</td>
              </tr>
              <tr>
                <td className="px-3 py-2 align-top">Supabase Inc.</td>
                <td className="px-3 py-2 align-top">Datenbank, Authentifizierung, Datei-Speicher</td>
                <td className="px-3 py-2 align-top">USA (Server-Region EU North, Stockholm) — SCCs</td>
              </tr>
              <tr>
                <td className="px-3 py-2 align-top">Sentry, Inc.</td>
                <td className="px-3 py-2 align-top">Fehler- und Performance-Monitoring</td>
                <td className="px-3 py-2 align-top">USA (Server-Region EU, Frankfurt) — SCCs</td>
              </tr>
              <tr>
                <td className="px-3 py-2 align-top">Sendinblue SAS (Brevo)</td>
                <td className="px-3 py-2 align-top">Versand transaktionaler E-Mails</td>
                <td className="px-3 py-2 align-top">Frankreich (EU)</td>
              </tr>
              <tr>
                <td className="px-3 py-2 align-top">DeepL SE</td>
                <td className="px-3 py-2 align-top">Maschinelle Übersetzung kundeneigener Inhalte (optional)</td>
                <td className="px-3 py-2 align-top">Deutschland (EU)</td>
              </tr>
              <tr>
                <td className="px-3 py-2 align-top">Anthropic, PBC</td>
                <td className="px-3 py-2 align-top">KI-gestützte Notiz-/Hinweis-Übersetzung (optional)</td>
                <td className="px-3 py-2 align-top">USA — SCCs (keine Trainingsnutzung der API-Daten)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Anlage 3 — Art und Kategorien der Daten</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Personenbezogene Daten</h3>
            <p>
              Vor- und Nachname, Firma, Kennzeichen, Anhängerkennzeichen, Telefonnummer
              (optional), Referenz-/Auftragsnummer (optional), Unterschrift als Pixelbild,
              Sprache, Zeitstempel der Erfassung, Bestätigung der Sicherheitsbelehrung,
              optionaler Ansprechpartner, optionale Notiz.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Technische Daten</h3>
            <p>
              IP-Adresse, Browser-/Geräte-Informationen, Server-Logdaten — verarbeitet
              ausschließlich zur Sicherheit der Anwendung und zur Missbrauchserkennung.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Account-Daten des Verantwortlichen</h3>
            <p>
              Firmenname, Adresse, Ansprechpartner, E-Mail-Adressen der nutzungsberechtigten
              Personen, gehashte Passwörter — verarbeitet zur Vertragsdurchführung.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-200 text-xs text-slate-400">
        AVV-Version {AVV_VERSION} · Stand {AVV_DATE}
      </div>
    </div>
  )
}
