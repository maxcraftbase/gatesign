import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { supabaseUrl, serviceKey } from '@/lib/supabase-server'

export async function GET() {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const settingsRes = await fetch(
      `${supabaseUrl}/rest/v1/app_settings?company_id=eq.${ctx.company.id}&key=eq.company_pdf_url&select=value`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
    )
    const rows: { value: string }[] = await settingsRes.json()
    const pdfUrl = rows[0]?.value
    if (!pdfUrl) return NextResponse.json({ error: 'Kein Unternehmens-PDF hinterlegt.' }, { status: 404 })

    const pdfRes = await fetch(pdfUrl)
    if (!pdfRes.ok) return NextResponse.json({ error: 'PDF konnte nicht geladen werden.' }, { status: 502 })

    const bytes = await pdfRes.arrayBuffer()
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
