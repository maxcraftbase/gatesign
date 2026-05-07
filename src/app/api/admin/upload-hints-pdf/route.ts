import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { checkAdminRateLimit } from '@/lib/rate-limit'
import { supabaseUrl, anonKey } from '@/lib/supabase-server'

const MAX_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await checkAdminRateLimit(ctx.company.id, 'upload-hints-pdf', 5, 60_000)) {
      return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warten.' }, { status: 429 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Fehlende Datei' }, { status: 400 })
    if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Nur PDF-Dateien erlaubt.' }, { status: 400 })
    if (file.size > MAX_SIZE_BYTES) return NextResponse.json({ error: 'Datei zu groß (max. 20 MB).' }, { status: 400 })
    const fileName = `${ctx.company.slug}/hints.pdf`
    const arrayBuffer = await file.arrayBuffer()

    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/briefings/${fileName}`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${ctx.accessToken}`,
        'Content-Type': 'application/pdf',
        'x-upsert': 'true',
      },
      body: arrayBuffer,
    })

    if (!uploadRes.ok) {
      console.error('Storage upload error:', await uploadRes.text())
      return NextResponse.json({ error: 'Fehler beim Hochladen.' }, { status: 500 })
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/briefings/${fileName}`

    await fetch(`${supabaseUrl}/rest/v1/app_settings`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${ctx.accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify([{
        company_id: ctx.company.id,
        key: 'hints_pdf_url',
        value: publicUrl,
        updated_at: new Date().toISOString(),
      }]),
    })

    return NextResponse.json({ success: true, url: publicUrl })
  } catch {
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const fileName = `${ctx.company.slug}/hints.pdf`

    await fetch(`${supabaseUrl}/storage/v1/object/briefings/${fileName}`, {
      method: 'DELETE',
      headers: { apikey: anonKey, Authorization: `Bearer ${ctx.accessToken}` },
    })

    await fetch(`${supabaseUrl}/rest/v1/app_settings?company_id=eq.${ctx.company.id}&key=eq.hints_pdf_url`, {
      method: 'DELETE',
      headers: { apikey: anonKey, Authorization: `Bearer ${ctx.accessToken}` },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
