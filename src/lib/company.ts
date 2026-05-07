import { supabaseUrl, anonKey } from '@/lib/supabase-server'

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

  // Default settings
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

  return { id: company.id }
}
