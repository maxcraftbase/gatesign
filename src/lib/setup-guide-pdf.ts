import PDFDocument from 'pdfkit'

export async function generateSetupGuidePdf(opts: {
  companyName: string
  terminalUrl: string
  adminUrl: string
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const DARK = '#0f172a'
    const BLUE = '#2563eb'
    const GRAY = '#64748b'
    const LIGHT = '#f8fafc'

    // ── Header ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 80).fill(DARK)
    doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('GateSign', 50, 25)
    doc.fillColor('#94a3b8').fontSize(11).font('Helvetica').text('Einrichtungsanleitung — Setup Guide', 50, 54)

    doc.fillColor(DARK).fontSize(13).font('Helvetica-Bold')
    doc.text(opts.companyName, 50, 100)
    doc.fillColor(GRAY).fontSize(10).font('Helvetica')
    doc.text('Vielen Dank für Ihre Registrierung bei GateSign.', 50, 118)
    doc.text('Diese Anleitung hilft Ihnen beim Einrichten des Check-in Terminals.', 50, 132)

    // ── Zugangsdaten ─────────────────────────────────────────────────────────
    doc.moveDown(1.5)
    doc.rect(50, doc.y, doc.page.width - 100, 70).fill(LIGHT)
    const boxY = doc.y + 12
    doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text('Ihre Zugangsdaten', 65, boxY)
    doc.fillColor(GRAY).fontSize(10).font('Helvetica')
    doc.text(`Check-in Terminal:  ${opts.terminalUrl}`, 65, boxY + 18)
    doc.text(`Admin-Dashboard: ${opts.adminUrl}`, 65, boxY + 33)
    doc.moveDown(4.5)

    // ── Abschnitt 1: iPad ────────────────────────────────────────────────────
    section(doc, '1', 'iPad / Tablet — Geführter Zugriff (Guided Access)', BLUE, DARK)

    doc.fillColor(DARK).fontSize(10).font('Helvetica')
    doc.text(
      'Der geführte Zugriff sperrt das iPad auf die GateSign-App. Besucher können das Gerät nicht verlassen.',
      50, doc.y, { width: doc.page.width - 100 }
    )
    doc.moveDown(0.5)

    steps(doc, GRAY, [
      'Einstellungen öffnen → Bedienungshilfen → Geführter Zugriff',
      'Geführten Zugriff aktivieren → Passcode-Einstellungen → Passcode festlegen',
      'Safari öffnen und zum Terminal-Link navigieren: ' + opts.terminalUrl,
      'Dreimal schnell den Home-Button (oder Seitentaste) drücken',
      '„Geführten Zugriff starten" antippen → fertig!',
      'Zum Beenden: erneut dreimal Home-Button → Passcode eingeben → „Beenden"',
    ])

    doc.moveDown(0.5)
    doc.fillColor(BLUE).fontSize(9).font('Helvetica')
    doc.text('Tipp: Deaktivieren Sie unter Einstellungen → Bildschirmzeit → Inhaltsbeschränkungen → Safari ggf. Einschränkungen.', 50, doc.y, { width: doc.page.width - 100 })

    // ── Abschnitt 2: Windows ─────────────────────────────────────────────────
    doc.moveDown(1.5)
    section(doc, '2', 'Windows PC — Chrome Kiosk-Modus', BLUE, DARK)

    doc.fillColor(DARK).fontSize(10).font('Helvetica')
    doc.text(
      'Chrome kann im Kiosk-Modus gestartet werden: kein Browser-UI, kein Alt+F4, keine Taskleiste.',
      50, doc.y, { width: doc.page.width - 100 }
    )
    doc.moveDown(0.5)

    steps(doc, GRAY, [
      'Rechtsklick auf den Desktop → Neu → Verknüpfung',
      'Ziel eintragen:',
      '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --kiosk ' + opts.terminalUrl,
      'Verknüpfung benennen: z.B. „GateSign Check-in Terminal"',
      'Verknüpfung starten — Chrome öffnet sich im Vollbild-Modus',
      'Zum Beenden: Strg + Alt + Entf → Task-Manager → Chrome beenden',
    ])

    doc.moveDown(0.5)
    doc.fillColor(BLUE).fontSize(9).font('Helvetica')
    doc.text(
      'Tipp: Autostart einrichten unter Einstellungen → Apps → Autostart → Verknüpfung hinzufügen.',
      50, doc.y, { width: doc.page.width - 100 }
    )

    // ── Abschnitt 3: Admin-Zugang ────────────────────────────────────────────
    doc.moveDown(1.5)
    section(doc, '3', 'Admin-Dashboard aufrufen', BLUE, DARK)

    doc.fillColor(DARK).fontSize(10).font('Helvetica')
    doc.text(
      'Das Admin-Dashboard erreichen Sie immer über:',
      50, doc.y, { width: doc.page.width - 100 }
    )
    doc.moveDown(0.4)
    doc.fillColor(BLUE).font('Helvetica-Bold').text(opts.adminUrl, 50, doc.y)
    doc.moveDown(0.4)
    doc.fillColor(DARK).font('Helvetica').fontSize(10)
    doc.text(
      'Aus dem Check-in Terminal: GateSign-Logo 3× schnell antippen → Admin-Login eingeben → Vollbild wird beendet.',
      50, doc.y, { width: doc.page.width - 100 }
    )

    // ── Footer ───────────────────────────────────────────────────────────────
    doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill(DARK)
    doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
    doc.text('GateSign — support@gatesign.app  |  gatesign.app', 50, doc.page.height - 25, {
      width: doc.page.width - 100,
      align: 'center',
    })

    doc.end()
  })
}

function section(doc: InstanceType<typeof PDFDocument>, num: string, title: string, blue: string, dark: string) {
  doc.circle(60, doc.y + 8, 10).fill(blue)
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text(num, 55, doc.y - 10)
  doc.fillColor(dark).fontSize(13).font('Helvetica-Bold').text(title, 78, doc.y - 18)
  doc.moveDown(0.8)
}

function steps(doc: InstanceType<typeof PDFDocument>, gray: string, items: string[]) {
  items.forEach((item, i) => {
    doc.fillColor(gray).fontSize(9).font('Helvetica')
    doc.text(`${i + 1}.  ${item}`, 60, doc.y, { width: doc.page.width - 110 })
    doc.moveDown(0.35)
  })
}
