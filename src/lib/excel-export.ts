import ExcelJS from 'exceljs'

export interface CheckInExportRow {
  id: string
  created_at: string
  visitor_type: string | null
  driver_name: string | null
  company_name: string | null
  license_plate: string | null
  trailer_plate: string | null
  phone: string | null
  contact_person: string | null
  language: string | null
  briefing_accepted: boolean | null
  briefing_accepted_at: string | null
  has_signature: boolean | null
  reference_number: string | null
}

function typeLabel(t: string | null): string {
  if (t === 'truck') return 'LKW'
  if (t === 'visitor') return 'Besucher'
  if (t === 'service') return 'Dienstleister'
  return t ?? ''
}

export async function buildCheckInsXlsx(rows: CheckInExportRow[]): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'GateSign'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Check-ins', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  sheet.columns = [
    { header: 'Referenz', key: 'reference_number', width: 16 },
    { header: 'Datum/Zeit', key: 'created_at', width: 20 },
    { header: 'Typ', key: 'visitor_type', width: 14 },
    { header: 'Fahrer', key: 'driver_name', width: 28 },
    { header: 'Firma', key: 'company_name', width: 28 },
    { header: 'Kennzeichen', key: 'license_plate', width: 14 },
    { header: 'Auflieger', key: 'trailer_plate', width: 14 },
    { header: 'Telefon', key: 'phone', width: 18 },
    { header: 'Ansprechpartner', key: 'contact_person', width: 22 },
    { header: 'Sprache', key: 'language', width: 10 },
    { header: 'Belehrung', key: 'briefing_accepted', width: 12 },
    { header: 'Belehrung-Zeit', key: 'briefing_accepted_at', width: 20 },
    { header: 'Unterschrift', key: 'has_signature', width: 12 },
    { header: 'ID', key: 'id', width: 38 },
  ]

  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF18181B' },
  }
  headerRow.alignment = { vertical: 'middle' }
  headerRow.height = 22

  for (const row of rows) {
    sheet.addRow({
      reference_number: row.reference_number ?? '',
      created_at: row.created_at ? new Date(row.created_at) : null,
      visitor_type: typeLabel(row.visitor_type),
      driver_name: row.driver_name ?? '',
      company_name: row.company_name ?? '',
      license_plate: row.license_plate ?? '',
      trailer_plate: row.trailer_plate ?? '',
      phone: row.phone ?? '',
      contact_person: row.contact_person ?? '',
      language: row.language ?? '',
      briefing_accepted: row.briefing_accepted ? 'Ja' : 'Nein',
      briefing_accepted_at: row.briefing_accepted_at ? new Date(row.briefing_accepted_at) : null,
      has_signature: row.has_signature ? 'Ja' : 'Nein',
      id: row.id,
    })
  }

  const dateFormat = 'dd.mm.yyyy hh:mm'
  sheet.getColumn('created_at').numFmt = dateFormat
  sheet.getColumn('briefing_accepted_at').numFmt = dateFormat

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columnCount },
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return buffer as ArrayBuffer
}
