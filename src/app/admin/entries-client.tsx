'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Download, RefreshCw, Printer, X, Languages, FileText } from 'lucide-react'

interface Entry {
  id: string
  created_at: string
  driver_name: string
  company_name: string
  license_plate: string
  trailer_plate: string | null
  phone: string | null
  language: string
  briefing_accepted: boolean
  briefing_accepted_at: string | null
  has_signature: boolean
  reference_number: string | null
  visitor_type: string | null
  contact_person: string | null
  staff_note: string | null
  staff_note_translated: string | null
  assigned_contact: string | null
}

const VISITOR_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  truck:   { label: 'LKW',       color: 'bg-amber-50 text-amber-700' },
  visitor: { label: 'Besucher',  color: 'bg-blue-50 text-blue-700' },
  service: { label: 'Dienst',    color: 'bg-violet-50 text-violet-700' },
}

const LANG_FLAGS: Record<string, string> = {
  de: '🇩🇪', en: '🇬🇧', pl: '🇵🇱', ro: '🇷🇴', cs: '🇨🇿',
  hu: '🇭🇺', bg: '🇧🇬', uk: '🇺🇦', ru: '🇷🇺', tr: '🇹🇷',
}

const LANG_NAMES: Record<string, string> = {
  de: 'Deutsch', en: 'Englisch', pl: 'Polnisch', ro: 'Rumänisch', cs: 'Tschechisch',
  hu: 'Ungarisch', bg: 'Bulgarisch', uk: 'Ukrainisch', ru: 'Russisch', tr: 'Türkisch',
}

const VISITOR_TYPE_FULL: Record<string, string> = {
  truck: 'LKW-Fahrer', visitor: 'Besucher', service: 'Dienstleister',
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
  } catch { return iso }
}

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

// ─── Print PDF ────────────────────────────────────────────────────────────────

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

  // ── Header ──
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

  // ── Grid ──
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

  // ── Note box ──
  const note = entry.staff_note_translated || entry.staff_note || ''
  if (note) {
    y += 8
    const noteLines = wrapText(ctx, note, IW - 32)
    const BOX_H = 48 + noteLines.length * 20
    ctx.fillStyle = '#f8fafc'; drawRoundRect(ctx, PAD, y, IW, BOX_H, 8); ctx.fill()
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.stroke()
    ctx.font = 'bold 10px Arial, sans-serif'; ctx.fillStyle = '#64748b'
    ctx.fillText(bil('noteLabel').toUpperCase(), PAD + 16, y + 12)
    ctx.font = '13px Arial, sans-serif'; ctx.fillStyle = '#1e293b'
    noteLines.forEach((l, i) => ctx.fillText(l, PAD + 16, y + 32 + i * 20))
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

  return new Blob([await pdfDoc.save()], { type: 'application/pdf' })
}

async function printEntry(entry: Entry, companyName: string, logoUrl?: string, companyPdfUrl?: string) {
  const w = window.open('', '_blank', 'width=800,height=900')
  if (!w) return
  w.document.write('<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif;color:#64748b;font-size:16px;">Dokument wird geladen…</body></html>')
  try {
    const blob = await buildMergedPdf(entry, companyName, logoUrl, companyPdfUrl)
    const blobUrl = URL.createObjectURL(blob)
    w.location.href = blobUrl
    setTimeout(() => URL.revokeObjectURL(blobUrl), 300_000)
  } catch (err) {
    console.error('Print error:', err)
    w.document.write('<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif;color:#ef4444;font-size:16px;">Fehler beim Laden des Dokuments.</body></html>')
  }
}

async function downloadPdf(entry: Entry, companyName: string, logoUrl?: string, companyPdfUrl?: string) {
  const blob = await buildMergedPdf(entry, companyName, logoUrl, companyPdfUrl)
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = `checkin-${entry.driver_name.replace(/\s+/g, '-')}-${entry.license_plate}.pdf`
  a.click()
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
// ─── Detail Modal ─────────────────────────────────────────────────────────────
function EntryModal({ entry, companyName, logoUrl, companyPdfUrl, contactPersons, onClose, onNoteUpdated }: {
  entry: Entry
  companyName: string
  logoUrl: string
  companyPdfUrl: string
  contactPersons: string[]
  onClose: () => void
  onNoteUpdated: (id: string, note: string, translated: string, assignedContact: string | null) => void
}) {
  const [note, setNote] = useState(entry.staff_note ?? '')
  const [translated, setTranslated] = useState(entry.staff_note_translated ?? '')
  const [assignedContact, setAssignedContact] = useState(entry.assigned_contact ?? '')
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [saved, setSaved] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/admin/entries/${entry.id}/note`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_note: note, staff_note_translated: translated, assigned_contact: assignedContact || null }),
      })
      if (res.ok) {
        onNoteUpdated(entry.id, note, translated, assignedContact || null)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleTranslate() {
    if (!note.trim()) return
    setTranslating(true)
    try {
      const res = await fetch('/api/admin/translate-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: note, targetLanguage: entry.language }),
      })
      if (res.ok) {
        const data = await res.json() as { translated: string }
        setTranslated(data.translated)
      }
    } finally {
      setTranslating(false)
    }
  }

  // auto-translate when note changes (debounced)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!note.trim()) { setTranslated(''); return }
    if (note === entry.staff_note) return
    const t = setTimeout(() => { void handleTranslate() }, 1200)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{entry.driver_name}</h2>
            <p className="text-sm text-slate-500">{formatDate(entry.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={downloading}
              onClick={async () => {
                setDownloading(true)
                try {
                  await downloadPdf({ ...entry, staff_note: note, staff_note_translated: translated, assigned_contact: assignedContact || null }, companyName, logoUrl, companyPdfUrl)
                } finally { setDownloading(false) }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors disabled:opacity-50">
              <Download className="w-4 h-4" />
              {downloading ? 'Wird erstellt…' : 'PDF'}
            </button>
            <button onClick={() => {
              void fetch(`/api/admin/entries/${entry.id}/print`, { method: 'POST' })
              void printEntry({ ...entry, staff_note: note, staff_note_translated: translated, assigned_contact: assignedContact || null }, companyName, logoUrl, companyPdfUrl)
            }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors">
              <Printer className="w-4 h-4" />
              Drucken
            </button>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="px-6 py-5 grid grid-cols-2 gap-x-8 gap-y-3 border-b border-slate-100">
          {entry.reference_number && (
            <div className="col-span-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Referenz</p>
              <p className="text-sm font-bold text-slate-900">{entry.reference_number}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Firma</p>
            <p className="text-sm text-slate-900">{entry.company_name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Kennzeichen</p>
            <p className="text-sm font-mono bg-slate-100 px-2 py-0.5 rounded w-fit">{entry.license_plate}{entry.trailer_plate ? ` + ${entry.trailer_plate}` : ''}</p>
          </div>
          {entry.phone && <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Telefon</p>
            <p className="text-sm text-slate-900">{entry.phone}</p>
          </div>}
          {entry.contact_person && <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Ansprechpartner</p>
            <p className="text-sm text-slate-900">{entry.contact_person}</p>
          </div>}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Sprache</p>
            <p className="text-sm text-slate-900">{LANG_FLAGS[entry.language]} {LANG_NAMES[entry.language] ?? entry.language}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Typ</p>
            <p className="text-sm text-slate-900">{VISITOR_TYPE_FULL[entry.visitor_type ?? ''] ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Belehrung</p>
            <p className="text-sm">{entry.briefing_accepted ? <span className="text-emerald-600 font-semibold">✓ Akzeptiert</span> : '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Unterschrift</p>
            <p className="text-sm">{entry.has_signature ? <span className="text-blue-600 font-semibold">✓ Ja</span> : '—'}</p>
          </div>
        </div>

        {/* Assigned Contact */}
        {contactPersons.length > 0 && (
          <div className="px-6 pt-5 pb-2">
            <label className="text-sm font-semibold text-slate-700 block mb-2">Ansprechpartner (für PDF)</label>
            <div className="flex flex-wrap gap-2">
              {contactPersons.map(person => (
                <button
                  key={person}
                  type="button"
                  onClick={() => setAssignedContact(assignedContact === person ? '' : person)}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-colors ${
                    assignedContact === person
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {person}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Staff Note */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-700">Mitarbeiter-Notiz</label>
            {translating && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 animate-pulse" />
                Übersetze…
              </span>
            )}
          </div>
          <textarea
            ref={textareaRef}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Notiz auf Deutsch eingeben — wird automatisch in die Fahrersprache übersetzt…"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 resize-none"
          />
          {translated && note && (
            <div className="mt-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
                Übersetzt ({LANG_FLAGS[entry.language]} {LANG_NAMES[entry.language]})
              </p>
              <p className="text-sm text-blue-900">{translated}</p>
            </div>
          )}
          <div className="flex items-center justify-between mt-3">
            {saved ? (
              <span className="text-sm text-emerald-600 font-medium">✓ Gespeichert</span>
            ) : <span />}
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors">
              {saving ? 'Speichern…' : 'Notiz speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AdminEntriesClient() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [contactPersons, setContactPersons] = useState<string[]>([])
  const [companyPdfUrl, setCompanyPdfUrl] = useState('')

  const loadEntries = useCallback((p: number) => {
    setLoading(true)
    setError('')
    fetch(`/api/admin/entries?page=${p}`)
      .then(res => { if (!res.ok) throw new Error('Failed'); return res.json() })
      .then(data => {
        setEntries(data.entries ?? [])
        setTotal(data.total ?? 0)
        setCompanyName(data.companyName ?? '')
        setLogoUrl(data.logoUrl ?? '')
        if (data.contactPersons) setContactPersons(data.contactPersons)
        setCompanyPdfUrl(data.companyPdfUrl ?? '')
        setPage(p)
      })
      .catch(() => setError('Fehler beim Laden der Einträge.'))
      .finally(() => setLoading(false))
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadEntries(1) }, [loadEntries])

  function handleNoteUpdated(id: string, note: string, translated: string, assignedContact: string | null) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, staff_note: note, staff_note_translated: translated, assigned_contact: assignedContact } : e))
    if (selectedEntry?.id === id) setSelectedEntry(e => e ? { ...e, staff_note: note, staff_note_translated: translated, assigned_contact: assignedContact } : e)
  }

  const totalPages = Math.max(1, Math.ceil(total / 50))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Check-in Einträge</h1>
          <p className="text-slate-500 text-sm mt-1">{total} Einträge gesamt</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => loadEntries(page)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Aktualisieren
          </button>
          <button onClick={() => window.open('/api/admin/export', '_blank')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors">
            <Download className="w-4 h-4" />
            CSV Export
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-slate-400 text-lg">Noch keine Check-ins.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {/* Header */}
            <div className="grid grid-cols-[100px_140px_80px_1fr_1fr_110px_50px_70px_30px] gap-3 px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Referenz</span>
              <span>Zeit</span>
              <span>Typ</span>
              <span>Fahrer</span>
              <span>Firma</span>
              <span>Kennzeichen</span>
              <span>Spr.</span>
              <span>Belehrung</span>
              <span></span>
            </div>

            <div className="flex flex-col gap-1.5">
              {entries.map(entry => (
                <div key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className="grid grid-cols-[100px_140px_80px_1fr_1fr_110px_50px_70px_30px] gap-3 items-center bg-white border border-slate-100 rounded-xl px-4 py-3 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer">

                  <span className="font-mono text-xs text-slate-500 truncate">
                    {entry.reference_number ?? <span className="text-slate-300">—</span>}
                  </span>

                  <span className="text-xs text-slate-500 whitespace-nowrap">{formatDate(entry.created_at)}</span>

                  <span>
                    {entry.visitor_type && VISITOR_TYPE_LABELS[entry.visitor_type] ? (
                      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${VISITOR_TYPE_LABELS[entry.visitor_type].color}`}>
                        {VISITOR_TYPE_LABELS[entry.visitor_type].label}
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </span>

                  <span className="font-semibold text-slate-900 text-sm truncate">{entry.driver_name}</span>

                  <span className="text-slate-600 text-sm truncate">{entry.company_name}</span>

                  <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs w-fit">
                    {entry.license_plate}
                  </span>

                  <span className="text-base" title={entry.language}>
                    {LANG_FLAGS[entry.language] ?? entry.language}
                  </span>

                  <span>
                    {entry.briefing_accepted
                      ? <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">✓ Ja</span>
                      : <span className="text-slate-300 text-xs">—</span>}
                  </span>

                  <span className="flex items-center justify-center">
                    {entry.staff_note
                      ? <FileText className="w-4 h-4 text-blue-400" aria-label="Notiz vorhanden" />
                      : null}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => loadEntries(page - 1)} disabled={page <= 1}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                ← Zurück
              </button>
              <span className="text-sm text-slate-500">Seite {page} von {totalPages}</span>
              <button onClick={() => loadEntries(page + 1)} disabled={page >= totalPages}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Weiter →
              </button>
            </div>
          )}
        </>
      )}

      {selectedEntry && (
        <EntryModal
          entry={selectedEntry}
          companyName={companyName}
          logoUrl={logoUrl}
          companyPdfUrl={companyPdfUrl}
          contactPersons={contactPersons}
          onClose={() => setSelectedEntry(null)}
          onNoteUpdated={handleNoteUpdated}
        />
      )}
    </div>
  )
}
