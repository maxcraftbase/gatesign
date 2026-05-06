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
async function printEntry(entry: Entry, companyName: string, logoUrl?: string, companyPdfUrl?: string) {
  const flag = LANG_FLAGS[entry.language] ?? ''
  const langName = LANG_NAMES[entry.language] ?? entry.language
  const date = formatDate(entry.created_at)
  const note = entry.staff_note_translated || entry.staff_note || ''
  const de = PDF_LABELS.de
  const t = PDF_LABELS[entry.language] ?? PDF_LABELS.de
  const bilingual = (key: keyof typeof de) =>
    entry.language !== 'de' ? `${de[key]} / ${t[key]}` : t[key]

  const visitorTypeLabel = entry.visitor_type === 'truck' ? t.truck : entry.visitor_type === 'visitor' ? t.visitor : entry.visitor_type === 'service' ? t.service : entry.visitor_type ?? '—'

  const html = `<!DOCTYPE html>
<html lang="${entry.language}">
<head>
<meta charset="UTF-8"/>
<title>Check-in — ${entry.driver_name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; font-size: 14px; }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
  .header-left { display: flex; align-items: center; gap: 16px; }
  .logo { max-height: 52px; max-width: 160px; object-fit: contain; }
  .company-name { font-size: 20px; font-weight: 700; color: #0f172a; }
  .header-right { text-align: right; }
  .doc-title { font-size: 13px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.06em; }
  .doc-date { font-size: 12px; color: #475569; margin-top: 2px; }
  .grid { display: grid; grid-template-columns: 220px 1fr; gap: 10px 16px; margin-bottom: 24px; }
  .label { color: #334155; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; padding-top: 2px; line-height: 1.35; }
  .value { font-size: 15px; font-weight: 500; }
  .plate { display: inline-block; padding: 3px 12px; border-radius: 4px; font-size: 13px; font-weight: 700; background: #f1f5f9; color: #0f172a; border: 1px solid #94a3b8; letter-spacing: 0.04em; font-family: monospace; }
  .plate-sep { font-size: 11px; color: #475569; margin: 0 6px; vertical-align: middle; }
  .note-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin-top: 8px; }
  .note-label { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
  .note-text { font-size: 14px; color: #1e293b; line-height: 1.6; }
  .divider { border: none; border-top: 1px solid #cbd5e1; margin: 24px 0; }
  .footer { font-size: 10px; color: #94a3b8; margin-top: 40px; text-align: center; }
  .check { color: #10b981; font-weight: bold; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="${companyName}"/>` : ''}
    <div class="company-name">${companyName}</div>
  </div>
  <div class="header-right">
    <div class="doc-title">${entry.language !== 'de' ? `${de.title} / ${t.title}` : t.title}</div>
    <div class="doc-date">${date}</div>
  </div>
</div>

<div class="grid">
  <div class="label">${bilingual('name')}</div><div class="value">${entry.driver_name}</div>
  <div class="label">${bilingual('company')}</div><div class="value">${entry.company_name}</div>
  <div class="label">${bilingual('plate')}</div>
  <div class="value">
    <span class="plate">${entry.license_plate}</span>
    ${entry.trailer_plate ? `<span class="plate-sep">·</span><span class="plate">${entry.trailer_plate}</span><span style="font-size:11px;color:#94a3b8;margin-left:4px">(${bilingual('trailer')})</span>` : ''}
  </div>
  ${entry.phone ? `<div class="label">${bilingual('phone')}</div><div class="value">${entry.phone}</div>` : ''}
  ${entry.contact_person ? `<div class="label">${bilingual('contactPerson')}</div><div class="value">${entry.contact_person}</div>` : ''}
  ${entry.reference_number ? `<div class="label">${bilingual('reference')}</div><div class="value">${entry.reference_number}</div>` : ''}
  <div class="label">${bilingual('visitorType')}</div><div class="value">${visitorTypeLabel}</div>
  <div class="label">${bilingual('language')}</div><div class="value">${flag} ${langName}</div>
  <div class="label">${bilingual('briefing')}</div><div class="value">${entry.briefing_accepted ? `<span class="check">${t.accepted}</span>` : '—'}</div>
  <div class="label">${bilingual('signature')}</div><div class="value">${entry.has_signature ? `<span class="check">${t.yes}</span>` : '—'}</div>
  ${entry.assigned_contact ? `<div class="label">${bilingual('assignedContact')}</div><div class="value" style="font-weight:700;color:#0f172a">${entry.assigned_contact}</div>` : ''}
</div>
${note ? `<hr class="divider"/><div class="note-box"><div class="note-label">${bilingual('noteLabel')}</div><div class="note-text">${note}</div></div>` : ''}
<div class="footer">${t.footer}</div>
</body>
</html>`

  let companyPagesHtml = ''
  if (companyPdfUrl) {
    try {
      const pdfjsLib = await import('pdfjs-dist')
      // Proxy fetch avoids CORS issues; worker served from public/
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      const pdfRes = await fetch('/api/admin/proxy-company-pdf')
      if (!pdfRes.ok) throw new Error(`Proxy ${pdfRes.status}`)
      const pdfBytes = await pdfRes.arrayBuffer()
      const pdfDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i)
        const viewport = page.getViewport({ scale: 2.0 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise
        companyPagesHtml += `<div style="page-break-before:always;margin:0;padding:0;"><img src="${canvas.toDataURL('image/jpeg', 0.92)}" style="width:100%;display:block;" /></div>`
      }
    } catch (err) {
      console.error('Company PDF render error:', err)
      // Fallback: open PDF in new tab
      window.open(companyPdfUrl, '_blank')
    }
  }

  const fullHtml = companyPagesHtml
    ? html.replace('</body>', `${companyPagesHtml}</body>`)
    : html

  const w = window.open('', '_blank', 'width=800,height=900')
  if (!w) return
  w.document.write(fullHtml)
  w.document.close()
  w.focus()
  setTimeout(() => { w.print(); w.close() }, 400)
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
