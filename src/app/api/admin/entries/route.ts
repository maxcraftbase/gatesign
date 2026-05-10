import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { supabaseUrl, anonKey, serviceKey } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const search = searchParams.get('search')?.trim() ?? ''
    const type = searchParams.get('type') ?? ''
    const terminalFilter = searchParams.get('terminal') ?? ''
    const SORTABLE = ['created_at', 'driver_name', 'company_name'] as const
    const sortRaw = searchParams.get('sort') ?? 'created_at'
    const sortCol = (SORTABLE as readonly string[]).includes(sortRaw) ? sortRaw : 'created_at'
    const sortDir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc'
    const limit = 50
    const offset = (page - 1) * limit

    // For members: fetch their allowed terminals first
    let allowedTerminalIds: string[] | null = null
    if (ctx.role === 'member') {
      const accessRes = await fetch(
        `${supabaseUrl}/rest/v1/user_terminal_access?user_id=eq.${ctx.userId}&company_id=eq.${ctx.company.id}&select=terminal_id`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
      )
      const accessRows: { terminal_id: string }[] = accessRes.ok ? await accessRes.json() : []
      allowedTerminalIds = accessRows.map(r => r.terminal_id)
      // Member with no assigned terminals sees nothing
      if (allowedTerminalIds.length === 0) {
        return NextResponse.json({ entries: [], total: 0, page, limit, companyName: ctx.company.name, logoUrl: '', contactPersons: [], companyPdfUrl: '', terminals: [] })
      }
    }

    const params = new URLSearchParams({
      company_id: `eq.${ctx.company.id}`,
      select: 'id,created_at,driver_name,company_name,license_plate,trailer_plate,phone,language,visitor_type,briefing_accepted,briefing_accepted_at,has_signature,reference_number,contact_person,staff_note,staff_note_translated,assigned_contact,terminal_id,terminals(name)',
      order: `${sortCol}.${sortDir}`,
      limit: String(limit),
      offset: String(offset),
    })

    if (search) {
      const term = `*${search}*`
      params.set('or', `(driver_name.ilike.${term},reference_number.ilike.${term},company_name.ilike.${term})`)
    }
    if (type && ['truck', 'visitor', 'service'].includes(type)) {
      params.set('visitor_type', `eq.${type}`)
    }

    // Apply terminal filter: either from member restrictions or from explicit filter param
    if (allowedTerminalIds !== null) {
      const ids = terminalFilter && allowedTerminalIds.includes(terminalFilter)
        ? [terminalFilter]
        : allowedTerminalIds
      params.set('terminal_id', `in.(${ids.join(',')})`)
    } else if (terminalFilter) {
      params.set('terminal_id', `eq.${terminalFilter}`)
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/check_ins?${params}`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${ctx.accessToken}`, Prefer: 'count=exact' },
      cache: 'no-store',
    })

    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })

    type RawEntry = Record<string, unknown> & { terminals?: { name: string } | null }
    const rawData: RawEntry[] = await res.json()
    const total = parseInt(res.headers.get('content-range')?.split('/')[1] ?? '0')

    // Flatten joined terminal name
    const data = rawData.map(e => ({
      ...e,
      terminal_name: (e.terminals as { name: string } | null)?.name ?? null,
      terminals: undefined,
    }))

    // Fetch settings + available terminals for filter dropdown
    let logoUrl = ''
    let contactPersons: string[] = []
    let companyPdfUrl = ''
    try {
      const settingsRes = await fetch(
        `${supabaseUrl}/rest/v1/app_settings?company_id=eq.${ctx.company.id}&key=in.(logo_url,contact_persons,company_pdf_url)&select=key,value`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
      )
      const settingsRows: { key: string; value: string }[] = await settingsRes.json()
      for (const row of settingsRows) {
        if (row.key === 'logo_url') logoUrl = row.value
        if (row.key === 'contact_persons') { try { contactPersons = JSON.parse(row.value) } catch (e) { console.error('[entries] contact_persons parse error:', e) } }
        if (row.key === 'company_pdf_url') companyPdfUrl = row.value
      }
    } catch (e) { console.error('[entries] settings fetch error:', e) }

    // Fetch terminals for filter UI (only allowed ones for members)
    let terminalsForFilter: { id: string; name: string }[] = []
    try {
      let termUrl = `${supabaseUrl}/rest/v1/terminals?company_id=eq.${ctx.company.id}&is_active=eq.true&order=sort_order.asc&select=id,name`
      if (allowedTerminalIds !== null) {
        termUrl += `&id=in.(${allowedTerminalIds.join(',')})`
      }
      const termRes = await fetch(termUrl, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' })
      if (termRes.ok) terminalsForFilter = await termRes.json()
    } catch (e) { console.error('[entries] terminals fetch error:', e) }

    return NextResponse.json({ entries: data, total, page, limit, companyName: ctx.company.name, logoUrl, contactPersons, companyPdfUrl, terminals: terminalsForFilter })
  } catch (err) {
    console.error('[entries] unexpected error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
