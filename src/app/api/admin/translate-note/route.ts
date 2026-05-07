import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { checkAdminRateLimit } from '@/lib/rate-limit'

const DEEPL_LANG_MAP: Record<string, string> = {
  de: 'DE', en: 'EN-GB', pl: 'PL', ro: 'RO', cs: 'CS',
  hu: 'HU', bg: 'BG', uk: 'UK', ru: 'RU', tr: 'TR',
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await checkAdminRateLimit(ctx.company.id, 'translate-note', 30, 60_000)) {
      return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warten.' }, { status: 429 })
    }

    const { text, targetLanguage } = await req.json() as { text: string; targetLanguage: string }
    if (!text?.trim()) return NextResponse.json({ translated: '' })

    const deeplLang = DEEPL_LANG_MAP[targetLanguage]
    if (!deeplLang || deeplLang === 'DE') return NextResponse.json({ translated: text })

    const apiKey = process.env.DEEPL_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'DeepL not configured' }, { status: 500 })

    const res = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: [text], target_lang: deeplLang, source_lang: 'DE' }),
    })

    if (!res.ok) return NextResponse.json({ error: 'Übersetzungsfehler' }, { status: 500 })
    const data = await res.json() as { translations: { text: string }[] }
    return NextResponse.json({ translated: data.translations[0]?.text ?? text })
  } catch {
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
