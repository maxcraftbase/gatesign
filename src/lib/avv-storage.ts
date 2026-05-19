import { supabaseUrl, serviceKey } from '@/lib/supabase-server'

export interface CompanyAvvState {
  id: string
  name: string
  slug: string
  avv_version: string | null
  avv_signed_at: string | null
  avv_signer_name: string | null
  avv_signer_role: string | null
  avv_company_address: string | null
  avv_company_register_no: string | null
  avv_signature_data: string | null
  avv_signature_ip: string | null
  avv_signature_user_agent: string | null
}

const SELECT = 'id,name,slug,avv_version,avv_signed_at,avv_signer_name,avv_signer_role,avv_company_address,avv_company_register_no,avv_signature_data,avv_signature_ip,avv_signature_user_agent'

export async function getCompanyAvvState(companyId: string): Promise<CompanyAvvState | null> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/companies?id=eq.${companyId}&select=${SELECT}&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  if (!res.ok) {
    // Migration 003_avv_signing.sql not yet applied — pretend AVV is signed so we
    // don't spam the banner across every admin until the column exists.
    if (res.status === 400) return { id: companyId, name: '', slug: '', avv_version: null, avv_signed_at: new Date(0).toISOString(), avv_signer_name: null, avv_signer_role: null, avv_company_address: null, avv_company_register_no: null, avv_signature_data: null, avv_signature_ip: null, avv_signature_user_agent: null }
    return null
  }
  const rows = await res.json() as CompanyAvvState[]
  return rows[0] ?? null
}

export interface SaveAvvSignatureInput {
  companyId: string
  signerName: string
  signerRole: string
  companyAddress: string
  companyRegisterNo: string | null
  avvVersion: string
  signatureData: string
  ip: string | null
  userAgent: string | null
}

export async function saveAvvSignature(input: SaveAvvSignatureInput): Promise<boolean> {
  const now = new Date().toISOString()
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
        avv_signed_at: now,
        avv_signer_name: input.signerName,
        avv_signer_role: input.signerRole,
        avv_company_address: input.companyAddress,
        avv_company_register_no: input.companyRegisterNo,
        avv_signature_data: input.signatureData,
        avv_signature_ip: input.ip,
        avv_signature_user_agent: input.userAgent,
      }),
    }
  )
  return res.ok
}
