import { type Entry, LANG_FLAGS, LANG_NAMES, formatDate } from '@/types/entry'

const PDF_LABELS: Record<string, Record<string, string>> = {
  de: { title: 'Check-in Bestätigung', name: 'Name', company: 'Firma', plate: 'Kennzeichen', trailer: 'Anhänger', phone: 'Telefon', contactPerson: 'Ansprechpartner', assignedContact: 'Ihr Ansprechpartner', reference: 'Referenz', visitorType: 'Besuchertyp', language: 'Sprache', briefing: 'Sicherheitsbelehrung', accepted: '✓ Akzeptiert', signature: 'Unterschrift', yes: '✓ Ja', noteLabel: 'Hinweis vom Unternehmen', footer: 'Erstellt mit GateSign · gatesign.de', truck: 'LKW-Fahrer', visitor: 'Besucher', service: 'Dienstleister' },
  en: { title: 'Check-in Confirmation', name: 'Name', company: 'Company', plate: 'License Plate', trailer: 'Trailer', phone: 'Phone', contactPerson: 'Contact Person', assignedContact: 'Your Contact', reference: 'Reference', visitorType: 'Visitor Type', language: 'Language', briefing: 'Safety Briefing', accepted: '✓ Accepted', signature: 'Signature', yes: '✓ Yes', noteLabel: 'Note from Company', footer: 'Created with GateSign · gatesign.de', truck: 'Truck Driver', visitor: 'Visitor', service: 'Service Provider' },
  pl: { title: 'Potwierdzenie zameldowania', name: 'Imię i nazwisko', company: 'Firma', plate: 'Tablica rejestracyjna', trailer: 'Przyczepa', phone: 'Telefon', contactPerson: 'Osoba kontaktowa', assignedContact: 'Twój opiekun', reference: 'Numer referencyjny', visitorType: 'Typ gościa', language: 'Język', briefing: 'Instruktaż BHP', accepted: '✓ Zaakceptowano', signature: 'Podpis', yes: '✓ Tak', noteLabel: 'Uwaga od firmy', footer: 'Utworzono z GateSign · gatesign.de', truck: 'Kierowca ciężarówki', visitor: 'Gość', service: 'Usługodawca' },
  ro: { title: 'Confirmare check-in', name: 'Nume', company: 'Companie', plate: 'Număr înmatriculare', trailer: 'Remorcă', phone: 'Telefon', contactPerson: 'Persoană de contact', assignedContact: 'Contactul dvs.', reference: 'Referință', visitorType: 'Tip vizitator', language: 'Limbă', briefing: 'Instruire securitate', accepted: '✓ Acceptat', signature: 'Semnătură', yes: '✓ Da', noteLabel: 'Notă de la companie', footer: 'Creat cu GateSign · gatesign.de', truck: 'Șofer camion', visitor: 'Vizitator', service: 'Prestator servicii' },
  cs: { title: 'Potvrzení příjezdu', name: 'Jméno', company: 'Firma', plate: 'SPZ', trailer: 'Přívěs', phone: 'Telefon', contactPerson: 'Kontaktní osoba', assignedContact: 'Váš kontakt', reference: 'Referenční číslo', visitorType: 'Typ návštěvníka', language: 'Jazyk', briefing: 'Bezpečnostní školení', accepted: '✓ Přijato', signature: 'Podpis', yes: '✓ Ano', noteLabel: 'Poznámka od společnosti', footer: 'Vytvořeno s GateSign · gatesign.de', truck: 'Řidič kamionu', visitor: 'Návštěvník', service: 'Poskytovatel služeb' },
  hu: { title: 'Bejelentkezés visszaigazolása', name: 'Név', company: 'Cég', plate: 'Rendszám', trailer: 'Pótkocsi', phone: 'Telefon', contactPerson: 'Kapcsolattartó', assignedContact: 'Az Ön kapcsolattartója', reference: 'Hivatkozási szám', visitorType: 'Látogatótípus', language: 'Nyelv', briefing: 'Biztonsági eligazítás', accepted: '✓ Elfogadva', signature: 'Aláírás', yes: '✓ Igen', noteLabel: 'Megjegyzés a cégtől', footer: 'Létrehozva GateSign-nal · gatesign.de', truck: 'Kamionos', visitor: 'Látogató', service: 'Szolgáltató' },
  bg: { title: 'Потвърждение за регистрация', name: 'Име', company: 'Фирма', plate: 'Рег. номер', trailer: 'Ремарке', phone: 'Телефон', contactPerson: 'Лице за контакт', assignedContact: 'Вашият контакт', reference: 'Референция', visitorType: 'Тип посетител', language: 'Език', briefing: 'Инструктаж по безопасност', accepted: '✓ Прието', signature: 'Подпис', yes: '✓ Да', noteLabel: 'Бележка от компанията', footer: 'Създадено с GateSign · gatesign.de', truck: 'Шофьор на камион', visitor: 'Посетител', service: 'Доставчик на услуги' },
  uk: { title: 'Підтвердження реєстрації', name: 'Ім\'я', company: 'Компанія', plate: 'Номерний знак', trailer: 'Причіп', phone: 'Телефон', contactPerson: 'Контактна особа', assignedContact: 'Ваш контакт', reference: 'Референс', visitorType: 'Тип відвідувача', language: 'Мова', briefing: 'Інструктаж з безпеки', accepted: '✓ Прийнято', signature: 'Підпис', yes: '✓ Так', noteLabel: 'Примітка від компанії', footer: 'Створено з GateSign · gatesign.de', truck: 'Водій вантажівки', visitor: 'Відвідувач', service: 'Постачальник послуг' },
  ru: { title: 'Подтверждение регистрации', name: 'Имя', company: 'Компания', plate: 'Номерной знак', trailer: 'Прицеп', phone: 'Телефон', contactPerson: 'Контактное лицо', assignedContact: 'Ваш контакт', reference: 'Референс', visitorType: 'Тип посетителя', language: 'Язык', briefing: 'Инструктаж по безопасности', accepted: '✓ Принято', signature: 'Подпись', yes: '✓ Да', noteLabel: 'Примечание от компании', footer: 'Создано с GateSign · gatesign.de', truck: 'Водитель грузовика', visitor: 'Посетитель', service: 'Поставщик услуг' },
  tr: { title: 'Giriş Onayı', name: 'Ad Soyad', company: 'Şirket', plate: 'Plaka', trailer: 'Römork', phone: 'Telefon', contactPerson: 'İrtibat kişisi', assignedContact: 'Sizin iletişim kişiniz', reference: 'Referans numarası', visitorType: 'Ziyaretçi türü', language: 'Dil', briefing: 'Güvenlik brifingfing', accepted: '✓ Kabul edildi', signature: 'İmza', yes: '✓ Evet', noteLabel: 'Şirket notu', footer: 'GateSign ile oluşturuldu · gatesign.de', truck: 'TIR sürücüsü', visitor: 'Ziyaretçi', service: 'Hizmet sağlayıcı' },
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current) { lines.push(current); current = word }
    else current = test
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

async function drawLabelCanvas(entry: Entry, companyName: string, logoUrl?: string): Promise<HTMLCanvasElement> {
  const SCALE = 2
  const W = 794, H = 1123
  const canvas = document.createElement('canvas')
  canvas.width = W * SCALE; canvas.height = H * SCALE
  const ctx = canvas.getContext('2d')!
  ctx.scale(SCALE, SCALE)

  const de = PDF_LABELS.de
  const t = PDF_LABELS[entry.language] ?? PDF_LABELS.de
  const bil = (k: keyof typeof de) => entry.language !== 'de' ? `${de[k]} / ${t[k]}` : t[k]

  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)
  ctx.textBaseline = 'top'

  const PAD = 40, IW = W - PAD * 2
  let y = PAD

  let headerBottom = y, leftX = PAD
  if (logoUrl) {
    try {
      const res = await fetch(logoUrl)
      const blobUrl = URL.createObjectURL(await res.blob())
      const img = new Image()
      await new Promise<void>(r => { img.onload = () => r(); img.onerror = () => r(); img.src = blobUrl })
      const maxW = 160, maxH = 52
      const ratio = Math.min(maxW / (img.naturalWidth || maxW), maxH / (img.naturalHeight || maxH))
      const dw = (img.naturalWidth || maxW) * ratio, dh = (img.naturalHeight || maxH) * ratio
      ctx.drawImage(img, PAD, y, dw, dh)
      URL.revokeObjectURL(blobUrl)
      leftX = PAD + dw + 12; headerBottom = Math.max(headerBottom, y + dh)
    } catch { /* skip logo on error */ }
  }
  ctx.font = 'bold 20px Arial, sans-serif'; ctx.fillStyle = '#0f172a'
  ctx.fillText(companyName, leftX, y + 6)
  headerBottom = Math.max(headerBottom, y + 28)

  ctx.textAlign = 'right'
  ctx.font = 'bold 11px Arial, sans-serif'; ctx.fillStyle = '#334155'
  ctx.fillText(bil('title').toUpperCase(), W - PAD, y)
  ctx.font = '12px Arial, sans-serif'; ctx.fillStyle = '#475569'
  ctx.fillText(formatDate(entry.created_at), W - PAD, y + 16)
  ctx.textAlign = 'left'
  y = headerBottom + 20

  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
  y += 16

  const COL1 = 220, ROW_H = 26
  function row(label: string, value: string, highlight = false) {
    const ll = wrapText(ctx, label, COL1 - 8)
    ctx.font = 'bold 10px Arial, sans-serif'; ctx.fillStyle = '#64748b'
    ll.forEach((l, i) => ctx.fillText(l.toUpperCase(), PAD, y + i * 13))
    ctx.font = highlight ? 'bold 14px Arial, sans-serif' : '14px Arial, sans-serif'
    ctx.fillStyle = highlight ? '#10b981' : '#1e293b'
    ctx.fillText(value || '—', PAD + COL1, y)
    y += Math.max(ROW_H, ll.length * 13 + 6)
  }

  const flag = LANG_FLAGS[entry.language] ?? ''
  const langName = LANG_NAMES[entry.language] ?? entry.language
  const vtLabel = entry.visitor_type === 'truck' ? t.truck : entry.visitor_type === 'visitor' ? t.visitor : entry.visitor_type === 'service' ? t.service : entry.visitor_type ?? '—'
  let plateValue = entry.license_plate
  if (entry.trailer_plate) plateValue += `  ·  ${entry.trailer_plate} (${bil('trailer')})`

  row(bil('name'), entry.driver_name)
  row(bil('company'), entry.company_name)
  row(bil('plate'), plateValue)
  if (entry.phone) row(bil('phone'), entry.phone)
  if (entry.contact_person) row(bil('contactPerson'), entry.contact_person)
  if (entry.reference_number) row(bil('reference'), entry.reference_number)
  row(bil('visitorType'), vtLabel)
  row(bil('language'), `${flag} ${langName}`)
  row(bil('briefing'), entry.briefing_accepted ? t.accepted : '—', entry.briefing_accepted)
  row(bil('signature'), entry.has_signature ? t.yes : '—', entry.has_signature)
  if (entry.assigned_contact) row(bil('assignedContact'), entry.assigned_contact)

  const noteDE = entry.staff_note || ''
  const noteLang = entry.language !== 'de' ? (entry.staff_note_translated || '') : ''
  if (noteDE || noteLang) {
    y += 8
    const deLinesArr = noteDE ? wrapText(ctx, noteDE, IW - 32) : []
    const langLinesArr = noteLang ? wrapText(ctx, noteLang, IW - 32) : []
    const hasBoth = deLinesArr.length > 0 && langLinesArr.length > 0
    const BOX_H = 12 + (deLinesArr.length > 0 ? 20 + deLinesArr.length * 20 : 0) + (hasBoth ? 14 : 0) + (langLinesArr.length > 0 ? 20 + langLinesArr.length * 20 : 0) + 12
    ctx.fillStyle = '#f8fafc'; drawRoundRect(ctx, PAD, y, IW, BOX_H, 8); ctx.fill()
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.stroke()
    let ny = y + 12
    if (deLinesArr.length > 0) {
      ctx.font = 'bold 10px Arial, sans-serif'; ctx.fillStyle = '#64748b'
      ctx.fillText(de.noteLabel.toUpperCase(), PAD + 16, ny); ny += 18
      ctx.font = '13px Arial, sans-serif'; ctx.fillStyle = '#1e293b'
      deLinesArr.forEach(l => { ctx.fillText(l, PAD + 16, ny); ny += 20 })
    }
    if (hasBoth) {
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(PAD + 16, ny + 4); ctx.lineTo(W - PAD - 16, ny + 4); ctx.stroke()
      ny += 14
    }
    if (langLinesArr.length > 0) {
      ctx.font = 'bold 10px Arial, sans-serif'; ctx.fillStyle = '#64748b'
      ctx.fillText(t.noteLabel.toUpperCase(), PAD + 16, ny); ny += 18
      ctx.font = '13px Arial, sans-serif'; ctx.fillStyle = '#1e293b'
      langLinesArr.forEach(l => { ctx.fillText(l, PAD + 16, ny); ny += 20 })
    }
    y += BOX_H + 12
  }

  ctx.font = '10px Arial, sans-serif'; ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'center'
  ctx.fillText(t.footer, W / 2, H - 20)
  ctx.textAlign = 'left'

  return canvas
}

async function buildMergedPdf(entry: Entry, companyName: string, logoUrl?: string, companyPdfUrl?: string): Promise<Blob> {
  const labelCanvas = await drawLabelCanvas(entry, companyName, logoUrl)
  const { PDFDocument } = await import('pdf-lib')
  const pdfDoc = await PDFDocument.create()

  const pngBytes = Uint8Array.from(atob(labelCanvas.toDataURL('image/png').split(',')[1]), c => c.charCodeAt(0))
  const labelImg = await pdfDoc.embedPng(pngBytes)
  const labelPage = pdfDoc.addPage([595.28, 841.89])
  labelPage.drawImage(labelImg, { x: 0, y: 0, width: 595.28, height: 841.89 })

  if (companyPdfUrl) {
    try {
      const pdfRes = await fetch('/api/admin/proxy-company-pdf')
      if (pdfRes.ok) {
        const companyBytes = new Uint8Array(await pdfRes.arrayBuffer())
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs') as any
        pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfJsDoc = await (pdfjsLib.getDocument as any)({ data: companyBytes.slice() }).promise
        const nonBlankIndices: number[] = []
        for (let i = 1; i <= pdfJsDoc.numPages; i++) {
          const pg = await pdfJsDoc.getPage(i)
          const vp = pg.getViewport({ scale: 0.15 })
          const chk = document.createElement('canvas')
          chk.width = Math.ceil(vp.width); chk.height = Math.ceil(vp.height)
          const chkCtx = chk.getContext('2d')!
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await pg.render({ canvasContext: chkCtx as any, viewport: vp }).promise
          let nonWhite = 0
          try {
            const imgData = chkCtx.getImageData(0, 0, chk.width, chk.height)
            for (let px = 0; px < imgData.data.length; px += 4) {
              if (imgData.data[px] < 240 || imgData.data[px + 1] < 240 || imgData.data[px + 2] < 240) nonWhite++
            }
          } catch { nonWhite = 999 }
          if (nonWhite >= 5) nonBlankIndices.push(i - 1)
        }
        if (nonBlankIndices.length > 0) {
          const companyDoc = await PDFDocument.load(companyBytes)
          const copied = await pdfDoc.copyPages(companyDoc, nonBlankIndices)
          for (const p of copied) pdfDoc.addPage(p)
        }
      }
    } catch (err) {
      console.error('Company PDF error:', err)
    }
  }

  return new Blob([new Uint8Array(await pdfDoc.save())], { type: 'application/pdf' })
}

export async function printEntry(entry: Entry, companyName: string, logoUrl?: string, companyPdfUrl?: string) {
  const blob = await buildMergedPdf(entry, companyName, logoUrl, companyPdfUrl)
  const blobUrl = URL.createObjectURL(blob)
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;height:297mm;border:none'
  document.body.appendChild(iframe)
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow!.print()
      setTimeout(() => {
        try { document.body.removeChild(iframe) } catch {}
        URL.revokeObjectURL(blobUrl)
      }, 60_000)
    }, 500)
  }
  iframe.src = blobUrl
}

export async function downloadPdf(entry: Entry, companyName: string, logoUrl?: string, companyPdfUrl?: string) {
  const blob = await buildMergedPdf(entry, companyName, logoUrl, companyPdfUrl)
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = `checkin-${entry.driver_name.replace(/\s+/g, '-')}-${entry.license_plate}.pdf`
  a.click()
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
}
