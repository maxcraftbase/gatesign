import PDFDocument from 'pdfkit'
import { AVV_VERSION, AVV_DATE } from './avv-content'

export interface AvvPdfData {
  companyName: string
  acceptedAt: Date
  avvVersion: string
  acceptedByEmail?: string
  ip?: string
  userAgent?: string
}

const PROCESSOR = {
  legalName: 'Alpha Consult GmbH',
  product: 'GateSign',
  address: 'Domring 2, 59581 Warstein, Deutschland',
  register: 'Amtsgericht Arnsberg, HRB 13161',
  email: 'info@alpha-consult.one',
}

const DARK = '#0f172a'
const SLATE = '#475569'
const MUTED = '#94a3b8'
const RULE = '#e2e8f0'

const PAGE_MARGIN = 50
const CONTENT_WIDTH_OFFSET = 100

type Doc = InstanceType<typeof PDFDocument>

export async function buildAvvPdf(data: AvvPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4', bufferPages: true })
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    coverPage(doc, data)
    doc.addPage()
    contractBody(doc)
    doc.addPage()
    annex1(doc)
    doc.addPage()
    annex2(doc)
    doc.addPage()
    annex3(doc)
    doc.addPage()
    acceptancePage(doc, data)
    pageNumbers(doc)

    doc.end()
  })
}

function coverPage(doc: Doc, data: AvvPdfData) {
  doc.rect(0, 0, doc.page.width, 110).fill(DARK)
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('GateSign', PAGE_MARGIN, 36)
  doc.fillColor('#94a3b8').fontSize(11).font('Helvetica').text('Auftragsverarbeitungsvertrag nach Art. 28 DSGVO', PAGE_MARGIN, 64)
  doc.fillColor('#94a3b8').fontSize(9).text(`Version ${data.avvVersion} · Stand ${AVV_DATE}`, PAGE_MARGIN, 82)

  doc.y = 160
  doc.fillColor(DARK).fontSize(22).font('Helvetica-Bold')
    .text('Auftragsverarbeitungsvertrag', PAGE_MARGIN, doc.y, { width: doc.page.width - CONTENT_WIDTH_OFFSET })
  doc.moveDown(0.3)
  doc.fillColor(SLATE).fontSize(11).font('Helvetica')
    .text('zwischen den nachfolgend genannten Parteien:', { width: doc.page.width - CONTENT_WIDTH_OFFSET })

  doc.moveDown(1.5)
  partyBlock(doc, 'Verantwortlicher (Kunde)', [data.companyName])

  doc.moveDown(0.6)
  partyBlock(doc, 'Auftragsverarbeiter', [
    PROCESSOR.legalName,
    PROCESSOR.address,
    PROCESSOR.register,
    `Kontakt: ${PROCESSOR.email}`,
  ])

  doc.moveDown(2)
  doc.fillColor(MUTED).fontSize(9).font('Helvetica')
    .text(
      'Dieser Vertrag regelt die Verarbeitung personenbezogener Daten durch den Auftragsverarbeiter im Auftrag des Verantwortlichen ' +
      'gemäß Art. 28 DSGVO im Zusammenhang mit der Nutzung der Software „GateSign". Die Annahme erfolgte elektronisch durch ' +
      'Click-Wrap während der Registrierung; der Annahme-Nachweis befindet sich auf der letzten Seite.',
      PAGE_MARGIN, doc.y, { width: doc.page.width - CONTENT_WIDTH_OFFSET, align: 'justify' }
    )
}

function partyBlock(doc: Doc, label: string, lines: string[]) {
  const w = doc.page.width - CONTENT_WIDTH_OFFSET
  const startY = doc.y
  doc.rect(PAGE_MARGIN, startY, w, 6).fill(RULE)
  doc.y = startY + 14
  doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text(label, PAGE_MARGIN, doc.y, { width: w })
  doc.moveDown(0.3)
  doc.fillColor(SLATE).fontSize(10).font('Helvetica')
  for (const l of lines) {
    doc.text(l, PAGE_MARGIN, doc.y, { width: w })
  }
}

function paragraph(doc: Doc, title: string, body: string | string[]) {
  if (doc.y > doc.page.height - 140) doc.addPage()
  doc.fillColor(DARK).fontSize(12).font('Helvetica-Bold')
    .text(title, PAGE_MARGIN, doc.y, { width: doc.page.width - CONTENT_WIDTH_OFFSET })
  doc.moveDown(0.3)
  doc.fillColor(SLATE).fontSize(10).font('Helvetica')
  const lines = Array.isArray(body) ? body : [body]
  for (const l of lines) {
    doc.text(l, PAGE_MARGIN, doc.y, { width: doc.page.width - CONTENT_WIDTH_OFFSET, align: 'justify' })
    doc.moveDown(0.4)
  }
  doc.moveDown(0.6)
}

function bullets(doc: Doc, items: string[]) {
  doc.fillColor(SLATE).fontSize(10).font('Helvetica')
  for (const item of items) {
    doc.text(`•  ${item}`, PAGE_MARGIN + 10, doc.y, { width: doc.page.width - CONTENT_WIDTH_OFFSET - 10, align: 'justify' })
    doc.moveDown(0.3)
  }
  doc.moveDown(0.4)
}

function contractBody(doc: Doc) {
  doc.fillColor(DARK).fontSize(16).font('Helvetica-Bold').text('Vertragsbestimmungen', PAGE_MARGIN, doc.y)
  doc.moveDown(1)

  paragraph(doc, 'Präambel',
    `Der Verantwortliche nutzt die Software „${PROCESSOR.product}" der ${PROCESSOR.legalName} (nachfolgend „Auftragsverarbeiter") ` +
    'zur Erfassung und Dokumentation von Check-ins am Empfang. Hierbei werden im Auftrag des Verantwortlichen personenbezogene ' +
    'Daten verarbeitet. Die Parteien schließen diesen Auftragsverarbeitungsvertrag (AVV) zur Erfüllung der Anforderungen nach ' +
    'Art. 28 DSGVO.'
  )
  paragraph(doc, '§ 1 Gegenstand und Dauer des Auftrags', [
    'Gegenstand des Auftrags ist die Bereitstellung und der Betrieb der Check-in-Software GateSign zur Erfassung von Besucherinnen ' +
    'und Besuchern, Fahrerinnen und Fahrern sowie Dienstleisterinnen und Dienstleistern, einschließlich Dokumentation der ' +
    'Sicherheitsunterweisung und Speicherung der erhobenen Daten im Admin-Bereich des Verantwortlichen.',
    'Die Vereinbarung wird auf unbestimmte Zeit geschlossen und endet mit Beendigung des zugrundeliegenden Hauptvertrages über die ' +
    'Nutzung von GateSign.',
  ])
  paragraph(doc, '§ 2 Art, Umfang und Zweck der Verarbeitung',
    'Die Verarbeitung dient der Erfassung, Speicherung, Anzeige und Bereitstellung von Check-in-Daten zur Sicherheits- und ' +
    'Zutrittsdokumentation des Verantwortlichen, insbesondere zur Erfüllung der Dokumentationspflicht nach § 12 ArbSchG sowie zur ' +
    'Wahrnehmung des berechtigten Interesses an der Kontrolle des Werks- und Betriebsgeländes (Art. 6 Abs. 1 lit. c und f DSGVO). ' +
    'Eine Verarbeitung außerhalb dieses Zwecks erfolgt nicht.'
  )
  paragraph(doc, '§ 3 Art der Daten und Kategorien betroffener Personen', 'Verarbeitet werden insbesondere folgende Datenkategorien (vgl. Anlage 3):')
  bullets(doc, [
    'Stammdaten (Vor- und Nachname, ggf. Firma/Spedition, ggf. Kontaktdaten)',
    'Fahrzeugdaten (Kennzeichen, Anhängerkennzeichen, Referenz-/Auftragsnummer)',
    'Bestätigungs- und Dokumentationsdaten (Unterschrift als Pixelbild, Zeitstempel, Sprache, Bestätigung der Sicherheitsbelehrung)',
    'Optionale Notizen, Ansprechpartner-Zuordnung, Ein- und Auschecks',
    'Technische Daten zur Sicherheit (IP-Adresse, Browser-/Geräte-Informationen, Logdaten)',
  ])
  doc.fillColor(SLATE).fontSize(10).font('Helvetica').text(
    'Kategorien betroffener Personen: Besucherinnen und Besucher, Fahrerinnen und Fahrer, Dienstleisterinnen und Dienstleister ' +
    'sowie Mitarbeitende des Verantwortlichen (Empfangs- und Verwaltungspersonal).',
    PAGE_MARGIN, doc.y, { width: doc.page.width - CONTENT_WIDTH_OFFSET, align: 'justify' }
  )
  doc.moveDown(0.8)

  paragraph(doc, '§ 4 Rechte und Pflichten des Verantwortlichen',
    'Der Verantwortliche ist im Sinne von Art. 4 Nr. 7 DSGVO allein verantwortlich für die Zulässigkeit der Verarbeitung und für die ' +
    'Wahrung der Rechte der betroffenen Personen. Weisungen erfolgen grundsätzlich in Textform; mündliche Weisungen werden vom ' +
    'Auftragsverarbeiter unverzüglich in Textform bestätigt. Eine Liste weisungsberechtigter Personen wird beim Verantwortlichen geführt.'
  )
  paragraph(doc, '§ 5 Allgemeine Pflichten des Auftragsverarbeiters', 'Der Auftragsverarbeiter verpflichtet sich insbesondere zu:')
  bullets(doc, [
    'Verarbeitung der Daten ausschließlich im Rahmen der Weisungen des Verantwortlichen;',
    'schriftliche Information des Verantwortlichen, wenn er der Auffassung ist, dass eine Weisung gegen geltendes Datenschutzrecht verstößt;',
    'Gestaltung der internen Organisation derart, dass sie den besonderen Anforderungen des Datenschutzes gerecht wird;',
    'Umsetzung der in Anlage 1 vereinbarten technischen und organisatorischen Maßnahmen;',
    'Bereitstellung der zum Nachweis der Einhaltung der Pflichten aus Art. 28 DSGVO erforderlichen Informationen.',
  ])
  paragraph(doc, '§ 6 Vertraulichkeit',
    'Der Auftragsverarbeiter setzt zur Verarbeitung der Daten nur Beschäftigte und Subunternehmer ein, die auf die Vertraulichkeit ' +
    'verpflichtet wurden und mit den maßgeblichen Datenschutzbestimmungen vertraut sind. Die Verpflichtung wirkt auch nach Beendigung ' +
    'der Tätigkeit fort.'
  )
  paragraph(doc, '§ 7 Technische und organisatorische Maßnahmen',
    'Der Auftragsverarbeiter trifft die in Anlage 1 beschriebenen technischen und organisatorischen Maßnahmen nach Art. 32 DSGVO und ' +
    'gewährleistet ein dem Risiko angemessenes Schutzniveau. Änderungen sind möglich, sofern das Schutzniveau erhalten bleibt; ' +
    'wesentliche Änderungen werden dem Verantwortlichen mitgeteilt.'
  )
  paragraph(doc, '§ 8 Inanspruchnahme weiterer Auftragsverarbeiter (Subunternehmer)', [
    'Der Verantwortliche erteilt dem Auftragsverarbeiter mit Abschluss dieses AVV die allgemeine Genehmigung zur Inanspruchnahme der in ' +
    'Anlage 2 aufgeführten Subunternehmer. Der Auftragsverarbeiter wird den Verantwortlichen über beabsichtigte Änderungen der Liste ' +
    'informieren. Der Verantwortliche kann der Beauftragung neuer Subunternehmer innerhalb von 14 Tagen aus wichtigem Grund widersprechen.',
    'Mit allen Subunternehmern werden Verträge geschlossen, die den Anforderungen des Art. 28 DSGVO entsprechen. Bei Übermittlung in ' +
    'Drittländer werden geeignete Garantien (insbesondere Standardvertragsklauseln gemäß Art. 46 Abs. 2 lit. c DSGVO) sichergestellt.',
  ])
  paragraph(doc, '§ 9 Unterstützung bei Betroffenenrechten',
    'Der Auftragsverarbeiter unterstützt den Verantwortlichen im Rahmen seiner Möglichkeiten bei der Erfüllung der Rechte der ' +
    'betroffenen Personen (Art. 12 bis 22 DSGVO). Der Admin-Bereich enthält Funktionen zur Auskunft, Löschung und zum Export der ' +
    'erfassten Daten.'
  )
  paragraph(doc, '§ 10 Mitteilungspflichten bei Datenschutzverletzungen',
    'Der Auftragsverarbeiter meldet dem Verantwortlichen Verletzungen des Schutzes personenbezogener Daten unverzüglich, spätestens ' +
    'innerhalb von 24 Stunden nach Kenntniserlangung. Die Meldung enthält die Informationen nach Art. 33 Abs. 3 DSGVO, soweit verfügbar.'
  )
  paragraph(doc, '§ 11 Datenschutz-Folgenabschätzung',
    'Der Auftragsverarbeiter unterstützt den Verantwortlichen bei einer eventuell erforderlichen Datenschutz-Folgenabschätzung ' +
    'gemäß Art. 35 DSGVO und einer vorherigen Konsultation der Aufsichtsbehörde gemäß Art. 36 DSGVO im erforderlichen Umfang.'
  )
  paragraph(doc, '§ 12 Weisungsrecht des Verantwortlichen',
    'Der Verantwortliche ist im Rahmen der vertraglich vereinbarten Leistungen jederzeit berechtigt, Weisungen über Art, Umfang und ' +
    'Verfahren der Datenverarbeitung zu erteilen. Weisungen können nach diesem AVV ergänzt, geändert oder ersetzt werden.'
  )
  paragraph(doc, '§ 13 Löschung und Rückgabe von Daten',
    'Check-in-Daten werden für die Dauer von maximal 2 Jahren ab Erfassung gespeichert (vgl. Datenschutzerklärung § 7). Auf ' +
    'Verlangen des Verantwortlichen werden Daten früher gelöscht. Nach Beendigung des Hauptvertrages werden sämtliche im Auftrag ' +
    'verarbeiteten Daten innerhalb von 90 Tagen gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen. Auf ' +
    'Wunsch erfolgt zuvor eine Übergabe in einem gängigen, maschinenlesbaren Format (CSV/JSON).'
  )
  paragraph(doc, '§ 14 Kontrollrechte des Verantwortlichen',
    'Der Verantwortliche überzeugt sich vor Aufnahme der Datenverarbeitung und sodann regelmäßig von der Einhaltung der technischen ' +
    'und organisatorischen Maßnahmen. Der Auftragsverarbeiter stellt hierzu auf Anfrage geeignete Nachweise zur Verfügung. ' +
    'Vor-Ort-Kontrollen sind nach vorheriger Abstimmung zu üblichen Geschäftszeiten möglich.'
  )
  paragraph(doc, '§ 15 Haftung',
    'Für die Haftung der Parteien gilt Art. 82 DSGVO. Im Innenverhältnis haftet jede Partei für Schäden, die durch ihr Verschulden ' +
    'entstanden sind, im Umfang ihres Verursachungs- und Verschuldensanteils.'
  )
  paragraph(doc, '§ 16 Schlussbestimmungen',
    'Änderungen und Ergänzungen dieses Vertrages bedürfen der Textform. Sollte eine Bestimmung dieses Vertrages unwirksam sein oder ' +
    'werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. Es gilt deutsches Recht; ausschließlicher Gerichtsstand ist – ' +
    'soweit gesetzlich zulässig – der Sitz des Auftragsverarbeiters.'
  )
}

function annex1(doc: Doc) {
  doc.fillColor(DARK).fontSize(16).font('Helvetica-Bold')
    .text('Anlage 1 — Technische und organisatorische Maßnahmen', PAGE_MARGIN, doc.y, { width: doc.page.width - CONTENT_WIDTH_OFFSET })
  doc.fillColor(MUTED).fontSize(10).font('Helvetica').text('Art. 32 DSGVO', PAGE_MARGIN, doc.y)
  doc.moveDown(1)

  const sections = [
    ['1. Vertraulichkeit',
      'Zutritts- und Zugangskontrolle der Rechenzentren der Subunternehmer (Sicherheitspersonal, Vereinzelungsanlagen, 24/7-Überwachung). ' +
      'Zugriffskontrolle über rollenbasierte Berechtigungen (Admin / Member), Multi-Tenant-Isolation auf Datenbankebene (Row Level Security, ' +
      'Company-Scope). Trennungskontrolle pro Mandant (company_id).'],
    ['2. Integrität',
      'Weitergabekontrolle durch TLS 1.2+ bei jeder Datenübertragung. Eingabekontrolle durch Audit-Log (wer hat wann welche Aktion ausgeführt). ' +
      'Hash-basierte Versionierung der Sicherheitsbelehrungen.'],
    ['3. Verfügbarkeit und Belastbarkeit',
      'Hosting in einem ISO-27001-zertifizierten Rechenzentrum (Region EU). Tägliche automatisierte Datenbank-Backups, ' +
      'Wiederherstellungspunkt-Ziel ≤ 24 Stunden. Monitoring der Anwendung in Echtzeit (Error Tracking, Logs).'],
    ['4. Pseudonymisierung und Verschlüsselung',
      'Passwörter werden ausschließlich als bcrypt-Hash gespeichert. Datenbankzugang nur über JWT-basierte Authentifizierung. ' +
      'Verschlüsselung der Daten at-rest in der Supabase-Postgres-Instanz.'],
    ['5. Verfahren zur regelmäßigen Überprüfung',
      'Vierteljährliche Überprüfung der Subunternehmer-Verträge, jährliche Aktualisierung der TOM. Kontinuierliches ' +
      'Sicherheits-Monitoring durch Sentry. TypeScript-basierte Eingabevalidierung (Zod) für alle API-Endpunkte.'],
    ['6. Auftragskontrolle',
      'Sämtliche eingesetzten Subunternehmer wurden vor Beauftragung auf Eignung geprüft; mit allen bestehen Verträge mit ' +
      'Datenschutzklauseln entsprechend Art. 28 DSGVO.'],
  ]
  for (const [title, body] of sections) paragraph(doc, title, body)
}

function annex2(doc: Doc) {
  doc.fillColor(DARK).fontSize(16).font('Helvetica-Bold')
    .text('Anlage 2 — Genehmigte Subunternehmer', PAGE_MARGIN, doc.y, { width: doc.page.width - CONTENT_WIDTH_OFFSET })
  doc.moveDown(0.4)
  doc.fillColor(SLATE).fontSize(10).font('Helvetica')
    .text(
      'Der Verantwortliche genehmigt mit Abschluss dieses AVV die folgenden Subunternehmer. Sämtliche Verarbeitungen erfolgen in der ' +
      'EU oder unter geeigneten Garantien gemäß Art. 46 DSGVO (Standardvertragsklauseln).',
      { width: doc.page.width - CONTENT_WIDTH_OFFSET, align: 'justify' }
    )
  doc.moveDown(1)

  const rows: [string, string, string][] = [
    ['Railway Corp.', 'Hosting der Webanwendung', 'USA (Server-Region EU West, Amsterdam) — SCCs'],
    ['Supabase Inc.', 'Datenbank, Authentifizierung, Datei-Speicher', 'USA (Server-Region EU North, Stockholm) — SCCs'],
    ['Sentry, Inc.', 'Fehler- und Performance-Monitoring', 'USA (Server-Region EU, Frankfurt) — SCCs'],
    ['Sendinblue SAS (Brevo)', 'Versand transaktionaler E-Mails', 'Frankreich (EU)'],
    ['DeepL SE', 'Maschinelle Übersetzung kundeneigener Inhalte (optional)', 'Deutschland (EU)'],
    ['Anthropic, PBC', 'KI-gestützte Notiz-/Hinweis-Übersetzung (optional)', 'USA — SCCs (keine Trainingsnutzung der API-Daten)'],
  ]
  const w = doc.page.width - CONTENT_WIDTH_OFFSET
  const colW = [w * 0.30, w * 0.40, w * 0.30]
  const headerY = doc.y
  doc.rect(PAGE_MARGIN, headerY, w, 22).fill(RULE)
  doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold')
  doc.text('Subunternehmer', PAGE_MARGIN + 8, headerY + 6, { width: colW[0] - 16 })
  doc.text('Leistung', PAGE_MARGIN + colW[0] + 8, headerY + 6, { width: colW[1] - 16 })
  doc.text('Sitz / Region', PAGE_MARGIN + colW[0] + colW[1] + 8, headerY + 6, { width: colW[2] - 16 })
  doc.y = headerY + 26

  doc.fillColor(SLATE).fontSize(9).font('Helvetica')
  for (const [name, service, region] of rows) {
    const rowY = doc.y
    const h = Math.max(
      doc.heightOfString(name, { width: colW[0] - 16 }),
      doc.heightOfString(service, { width: colW[1] - 16 }),
      doc.heightOfString(region, { width: colW[2] - 16 }),
    ) + 14
    doc.text(name, PAGE_MARGIN + 8, rowY + 5, { width: colW[0] - 16 })
    doc.text(service, PAGE_MARGIN + colW[0] + 8, rowY + 5, { width: colW[1] - 16 })
    doc.text(region, PAGE_MARGIN + colW[0] + colW[1] + 8, rowY + 5, { width: colW[2] - 16 })
    doc.moveTo(PAGE_MARGIN, rowY + h).lineTo(PAGE_MARGIN + w, rowY + h).strokeColor(RULE).stroke()
    doc.y = rowY + h
  }
}

function annex3(doc: Doc) {
  doc.fillColor(DARK).fontSize(16).font('Helvetica-Bold')
    .text('Anlage 3 — Art und Kategorien der Daten', PAGE_MARGIN, doc.y, { width: doc.page.width - CONTENT_WIDTH_OFFSET })
  doc.moveDown(1)
  paragraph(doc, 'Personenbezogene Daten',
    'Vor- und Nachname, Firma, Kennzeichen, Anhängerkennzeichen, Telefonnummer (optional), Referenz-/Auftragsnummer (optional), ' +
    'Unterschrift als Pixelbild, Sprache, Zeitstempel der Erfassung, Bestätigung der Sicherheitsbelehrung, optionaler Ansprechpartner, ' +
    'optionale Notiz.'
  )
  paragraph(doc, 'Technische Daten',
    'IP-Adresse, Browser-/Geräte-Informationen, Server-Logdaten — verarbeitet ausschließlich zur Sicherheit der Anwendung und zur ' +
    'Missbrauchserkennung.'
  )
  paragraph(doc, 'Account-Daten des Verantwortlichen',
    'Firmenname, Adresse, Ansprechpartner, E-Mail-Adressen der nutzungsberechtigten Personen, gehashte Passwörter — verarbeitet zur ' +
    'Vertragsdurchführung.'
  )
}

function acceptancePage(doc: Doc, data: AvvPdfData) {
  doc.fillColor(DARK).fontSize(16).font('Helvetica-Bold')
    .text('Annahme-Nachweis', PAGE_MARGIN, doc.y, { width: doc.page.width - CONTENT_WIDTH_OFFSET })
  doc.moveDown(0.4)
  doc.fillColor(SLATE).fontSize(10).font('Helvetica')
    .text(
      'Die Annahme dieses Vertrages erfolgte elektronisch durch Click-Wrap. Der Verantwortliche hat im Registrierungs-Formular die ' +
      'kombinierte Annahmeerklärung für Nutzungsbedingungen, Datenschutzerklärung und diesen Auftragsverarbeitungsvertrag aktiv bestätigt.',
      { width: doc.page.width - CONTENT_WIDTH_OFFSET, align: 'justify' }
    )
  doc.moveDown(1.5)

  const startY = doc.y
  const w = doc.page.width - CONTENT_WIDTH_OFFSET
  doc.rect(PAGE_MARGIN, startY, w, 6).fill(RULE)
  doc.y = startY + 16

  const item = (label: string, value: string) => {
    doc.fillColor(MUTED).fontSize(9).font('Helvetica').text(label, PAGE_MARGIN, doc.y)
    doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text(value, PAGE_MARGIN, doc.y, { width: w })
    doc.moveDown(0.6)
  }
  item('Verantwortlicher', data.companyName)
  if (data.acceptedByEmail) item('Annahme durch (E-Mail)', data.acceptedByEmail)
  item('Zeitpunkt der Annahme', formatDateTime(data.acceptedAt))
  item('AVV-Version', `${data.avvVersion} · Stand ${AVV_DATE}`)
  if (data.ip) item('IP-Adresse zum Zeitpunkt der Annahme', data.ip)
  if (data.userAgent) item('Browser / Gerät', truncate(data.userAgent, 200))

  doc.moveDown(1)
  doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(
    'Die Annahme nach Art. 28 Abs. 9 DSGVO erfordert Textform (§ 126b BGB), nicht Schriftform (§ 126 BGB). ' +
    'Click-Wrap-Annahmen sind nach herrschender Meinung der Aufsichtsbehörden ausreichend, sofern Inhalt, Zeitpunkt und ' +
    'aktive Bestätigung dokumentiert sind. Dieser Nachweis liegt im Audit-Log des Auftragsverarbeiters und bleibt für ' +
    'die Dauer des Vertragsverhältnisses verfügbar.',
    PAGE_MARGIN, doc.y, { width: doc.page.width - CONTENT_WIDTH_OFFSET, align: 'justify' }
  )
}

function pageNumbers(doc: Doc) {
  const range = doc.bufferedPageRange()
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i)
    doc.fillColor(MUTED).fontSize(8).font('Helvetica')
      .text(
        `${i - range.start + 1} / ${range.count}  ·  AVV v${AVV_VERSION}  ·  ${PROCESSOR.legalName}`,
        PAGE_MARGIN,
        doc.page.height - 30,
        { width: doc.page.width - CONTENT_WIDTH_OFFSET, align: 'center', lineBreak: false }
      )
  }
}

function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())} Uhr`
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '…'
}
