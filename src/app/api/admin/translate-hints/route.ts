import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'

const DEEPL_LANGS: Record<string, string> = {
  en: 'EN-GB', pl: 'PL', ro: 'RO', cs: 'CS',
  hu: 'HU', bg: 'BG', uk: 'UK', ru: 'RU', tr: 'TR',
}

export async function POST() {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const apiKey = process.env.DEEPL_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'DEEPL_API_KEY nicht konfiguriert' }, { status: 500 })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const deeplBase = apiKey.endsWith(':fx')
      ? 'https://api-free.deepl.com/v2/translate'
      : 'https://api.deepl.com/v2/translate'

    const settingsRes = await fetch(
      `${supabaseUrl}/rest/v1/app_settings?company_id=eq.${ctx.company.id}&key=eq.custom_hints&select=value`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${ctx.accessToken}` }, cache: 'no-store' }
    )
    const rows = await settingsRes.json() as { value: string }[]
    const hints: string[] = rows[0]?.value ? JSON.parse(rows[0].value) as string[] : []

    if (hints.length === 0) return NextResponse.json({ success: true, translations: { de: [] } })

    const translations: Record<string, string[]> = { de: hints }

    for (const [lang, deeplLang] of Object.entries(DEEPL_LANGS)) {
      const res = await fetch(deeplBase, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: hints, source_lang: 'DE', target_lang: deeplLang }),
      })
      if (res.ok) {
        const data = await res.json() as { translations: { text: string }[] }
        translations[lang] = data.translations.map(t => t.text)
      } else {
        translations[lang] = hints
      }
    }

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
        key: 'custom_hints_translations',
        value: JSON.stringify(translations),
        updated_at: new Date().toISOString(),
      }]),
    })

    return NextResponse.json({ success: true, translations })
  } catch (err) {
    console.error('Translate hints error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
