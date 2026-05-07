import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { supabaseUrl, anonKey } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Fehlende Datei' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Nur PNG, JPG, SVG oder WebP erlaubt.' }, { status: 400 })
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Datei zu groß (max. 2 MB).' }, { status: 400 })
    }
    const fileName = `${ctx.company.slug}/logo.${ext}`
    const arrayBuffer = await file.arrayBuffer()

    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/briefings/${fileName}`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${ctx.accessToken}`,
        'Content-Type': file.type,
        'x-upsert': 'true',
      },
      body: arrayBuffer,
    })

    if (!uploadRes.ok) {
      const err = await uploadRes.text()
      console.error('Logo upload error:', err)
      return NextResponse.json({ error: 'Fehler beim Hochladen.' }, { status: 500 })
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/briefings/${fileName}`

    const settingsRes = await fetch(`${supabaseUrl}/rest/v1/app_settings`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${ctx.accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify([{
        company_id: ctx.company.id,
        key: 'logo_url',
        value: publicUrl,
        updated_at: new Date().toISOString(),
      }]),
    })

    if (!settingsRes.ok) {
      console.error('Logo settings save error:', await settingsRes.text())
      return NextResponse.json({ error: 'Logo hochgeladen, aber Einstellung konnte nicht gespeichert werden.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (err) {
    console.error('[upload-logo] error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // Delete all common extensions
    for (const ext of ['png', 'jpg', 'jpeg', 'svg', 'webp']) {
      await fetch(`${supabaseUrl}/storage/v1/object/briefings/${ctx.company.slug}/logo.${ext}`, {
        method: 'DELETE',
        headers: { apikey: anonKey, Authorization: `Bearer ${ctx.accessToken}` },
      })
    }

    await fetch(`${supabaseUrl}/rest/v1/app_settings?company_id=eq.${ctx.company.id}&key=eq.logo_url`, {
      method: 'DELETE',
      headers: { apikey: anonKey, Authorization: `Bearer ${ctx.accessToken}` },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[upload-logo] error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
