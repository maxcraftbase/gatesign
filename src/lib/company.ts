import { supabaseUrl, anonKey, serviceKey } from '@/lib/supabase-server'

export interface Terminal {
  id: string
  company_id: string
  name: string
  slug: string
  is_active: boolean
  sort_order: number
  created_at: string
  allowed_visitor_types: string
}

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[äöüß]/g, c => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c] ?? c))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}

export async function getCompanyBySlug(slug: string): Promise<{ id: string; name: string } | null> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/companies?slug=eq.${encodeURIComponent(slug)}&select=id,name&limit=1`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }, cache: 'no-store' }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data?.[0] ?? null
}

export async function getCompanyByOwner(accessToken: string): Promise<{ id: string; name: string; slug: string } | null> {
  // Extract owner_id from JWT sub claim — explicit filter, independent of RLS config
  let ownerId: string | null = null
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf-8'))
    ownerId = payload.sub ?? null
  } catch (e) { console.error('[company] JWT decode error (getCompanyByOwner):', e) }
  if (!ownerId) return null

  const res = await fetch(
    `${supabaseUrl}/rest/v1/companies?owner_id=eq.${encodeURIComponent(ownerId)}&select=id,name,slug&limit=1`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` }, cache: 'no-store' }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data?.[0] ?? null
}

export async function createCompanyWithDefaults(
  name: string,
  slug: string,
  accessToken: string,
  email?: string
): Promise<{ id: string } | null> {
  // Extract owner_id from JWT
  let ownerId: string | null = null
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf-8'))
    ownerId = payload.sub ?? null
  } catch (e) { console.error('[company] JWT decode error (createCompanyWithDefaults):', e) }

  // Create company
  const compRes = await fetch(`${supabaseUrl}/rest/v1/companies`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ name, slug, owner_id: ownerId, ...(email ? { email } : {}) }),
  })
  if (!compRes.ok) return null
  const [company] = await compRes.json()

  // Default settings — welcome_title enthält den Firmennamen, weil das Welcome
  // selbst das Brand-Element ist (besonders wenn kein Logo-Bild hochgeladen wurde).
  const defaultSettings = [
    { company_id: company.id, key: 'welcome_title', value: `Willkommen bei ${name}` },
    { company_id: company.id, key: 'welcome_subtitle', value: 'Bitte melden Sie sich hier an — Please register here' },
    { company_id: company.id, key: 'signature_required', value: 'false' },
    { company_id: company.id, key: 'briefing_version', value: '1.0' },
    { company_id: company.id, key: 'site_info', value: '' },
  ]

  await fetch(`${supabaseUrl}/rest/v1/app_settings`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(defaultSettings),
  })

  // Create default terminal (same slug as company for backward compat)
  await fetch(`${supabaseUrl}/rest/v1/terminals`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ company_id: company.id, name: `${name} Terminal`, slug, is_active: true, sort_order: 0 }),
  })

  return { id: company.id }
}

const TERMINAL_SELECT = 'id,company_id,name,slug,is_active,sort_order,created_at,allowed_visitor_types'

export async function getTerminalBySlug(companyId: string, terminalSlug: string): Promise<Terminal | null> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/terminals?company_id=eq.${encodeURIComponent(companyId)}&slug=eq.${encodeURIComponent(terminalSlug)}&is_active=eq.true&select=${TERMINAL_SELECT}&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data?.[0] ?? null
}

export async function getFirstTerminal(companyId: string): Promise<Terminal | null> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/terminals?company_id=eq.${encodeURIComponent(companyId)}&is_active=eq.true&order=sort_order.asc,created_at.asc&select=${TERMINAL_SELECT}&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data?.[0] ?? null
}

export async function listTerminals(companyId: string): Promise<Terminal[]> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/terminals?company_id=eq.${encodeURIComponent(companyId)}&order=sort_order.asc,created_at.asc&select=${TERMINAL_SELECT}`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  if (!res.ok) return []
  return await res.json()
}

export async function createDefaultTerminal(companyId: string, companyName: string, companySlug: string, accessToken: string): Promise<Terminal | null> {
  const res = await fetch(`${supabaseUrl}/rest/v1/terminals`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ company_id: companyId, name: `${companyName} Terminal`, slug: companySlug, is_active: true, sort_order: 0 }),
  })
  if (!res.ok) return null
  const [terminal] = await res.json()
  return terminal ?? null
}
