import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { getAdminContext } from '@/lib/admin-auth'
import { supabaseUrl, anonKey } from '@/lib/supabase-server'

interface CheckInRow {
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

export async function GET() {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const params = new URLSearchParams({
      company_id: `eq.${ctx.company.id}`,
      select: 'id,created_at,visitor_type,driver_name,company_name,license_plate,trailer_plate,phone,language,briefing_accepted,briefing_accepted_at,has_signature,reference_number,contact_person',
      order: 'created_at.desc',
      limit: '10000',
    })

    const res = await fetch(`${supabaseUrl}/rest/v1/check_ins?${params}`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${ctx.accessToken}` },
      cache: 'no-store',
    })

    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })

    const data: CheckInRow[] = await res.json()

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

    for (const row of data) {
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

    // Date columns: format as German date+time
    const dateFormat = 'dd.mm.yyyy hh:mm'
    sheet.getColumn('created_at').numFmt = dateFormat
    sheet.getColumn('briefing_accepted_at').numFmt = dateFormat

    // Auto-filter on the header row across all columns
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columnCount },
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `gatesign-${ctx.company.slug}-${new Date().toISOString().slice(0, 10)}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[export/xlsx] error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
