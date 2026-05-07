import type { AdminContext } from './admin-auth'
import { supabaseUrl, serviceKey } from '@/lib/supabase-server'


async function insertAuditLog(payload: Record<string, unknown>) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/audit_log`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) console.error('[audit] insert failed:', await res.text())
  } catch (err) {
    console.error('[audit] insert error:', err)
  }
}

export async function logAction(
  ctx: AdminContext,
  action: string,
  details?: Record<string, unknown>
) {
  await insertAuditLog({
    company_id: ctx.company.id,
    user_id: ctx.userId,
    user_email: ctx.email,
    action,
    details: details ?? null,
  })
}

export async function logLoginEvent(
  action: 'login_success' | 'login_failed',
  email: string,
  opts?: { userId?: string; companyId?: string; ip?: string }
) {
  await insertAuditLog({
    company_id: opts?.companyId ?? null,
    user_id: opts?.userId ?? null,
    user_email: email,
    action,
    details: opts?.ip ? { ip: opts.ip } : null,
  })
}
