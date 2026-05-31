import { NextRequest, NextResponse } from 'next/server'
import { getCompanyBySlug, getTerminalBySlug } from '@/lib/company'
import { hasAddon } from '@/lib/addons'
import { supabaseUrl, anonKey } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')
    const terminalSlug = req.nextUrl.searchParams.get('terminal')
    if (!slug) return NextResponse.json({}, { status: 400 })

    const company = await getCompanyBySlug(slug)
    if (!company) return NextResponse.json({}, { status: 404 })

    const res = await fetch(
      `${supabaseUrl}/rest/v1/app_settings?company_id=eq.${company.id}&select=key,value`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }, cache: 'no-store' }
    )
    const rows: { key: string; value: string }[] = await res.json()
    const settings: Record<string, string> = { company_name: company.name }
    for (const row of rows) settings[row.key] = row.value

    // Attach terminal info if requested
    if (terminalSlug) {
      const terminal = await getTerminalBySlug(company.id, terminalSlug)
      if (terminal) {
        settings.terminal_name = terminal.name
        settings.allowed_visitor_types = terminal.allowed_visitor_types ?? '["truck","visitor","service"]'
      }
    }

    // Printer-Add-on Flag — Terminal-UI zeigt Checkout-Button nur wenn aktiv
    settings.printer_addon_active = (await hasAddon(company.id, 'printer')) ? 'true' : 'false'

    return NextResponse.json(settings)
  } catch (err) {
    console.error('[settings] error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
