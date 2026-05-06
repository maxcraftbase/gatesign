import type { AdminContext } from './admin-auth'

export async function logAction(
  ctx: AdminContext,
  action: string,
  details?: Record<string, unknown>
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  try {
    await fetch(`${supabaseUrl}/rest/v1/audit_log`, {
      method: 'POST',
      headers: {
        apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json', Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        company_id: ctx.company.id,
        user_id: ctx.userId,
        user_email: ctx.email,
        action,
        details: details ?? null,
      }),
    })
  } catch { /* fire-and-forget */ }
}
