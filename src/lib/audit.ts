import type { AdminContext } from './admin-auth'

const SUPABASE_URL = () => process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY!

async function insertAuditLog(payload: Record<string, unknown>) {
  try {
    const res = await fetch(`${SUPABASE_URL()}/rest/v1/audit_log`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY(),
        Authorization: `Bearer ${SERVICE_KEY()}`,
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
