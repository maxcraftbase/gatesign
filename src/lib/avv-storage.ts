import { supabaseUrl, serviceKey } from '@/lib/supabase-server'

export interface CompanyAvvState {
  id: string
  name: string
  slug: string
  avv_version: string | null
  avv_signed_at: string | null
  avv_signature_ip: string | null
  avv_signature_user_agent: string | null
}

const SELECT = 'id,name,slug,avv_version,avv_signed_at,avv_signature_ip,avv_signature_user_agent'

export async function getCompanyAvvState(companyId: string): Promise<CompanyAvvState | null> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/companies?id=eq.${companyId}&select=${SELECT}&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  if (!res.ok) {
    // Migration 003_avv_signing.sql not yet applied — pretend AVV is accepted so we
    // don't spam the banner across every admin until the column exists.
    if (res.status === 400) return { id: companyId, name: '', slug: '', avv_version: null, avv_signed_at: new Date(0).toISOString(), avv_signature_ip: null, avv_signature_user_agent: null }
    return null
  }
  const rows = await res.json() as CompanyAvvState[]
  return rows[0] ?? null
}

export interface SaveAvvAcceptanceInput {
  companyId: string
  avvVersion: string
  acceptedAt: Date
  ip: string | null
  userAgent: string | null
}

export async function saveAvvAcceptance(input: SaveAvvAcceptanceInput): Promise<boolean> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/companies?id=eq.${input.companyId}`,
    {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        avv_version: input.avvVersion,
        avv_signed_at: input.acceptedAt.toISOString(),
        avv_signature_ip: input.ip,
        avv_signature_user_agent: input.userAgent,
      }),
    }
  )
  return res.ok
}
