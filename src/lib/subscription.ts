import { supabaseUrl, serviceKey } from '@/lib/supabase-server'

export type PlanName = 'starter' | 'professional' | 'enterprise'

export const PLAN_LIMITS: Record<PlanName, { terminal_limit: number | null; label: string; price: string }> = {
  starter:      { terminal_limit: 1,    label: 'Starter',       price: '49 €/Monat' },
  professional: { terminal_limit: 3,    label: 'Professional',  price: '99 €/Monat' },
  enterprise:   { terminal_limit: null, label: 'Enterprise',    price: 'Auf Anfrage' },
}

interface StripeData {
  customerId?: string
  subscriptionId?: string
  priceId?: string
  currentPeriodEnd?: Date
}

// Single function for plan changes — called manually by superadmin today,
// will be called by Stripe webhook handler once Stripe is integrated.
export async function applyPlan(companyId: string, plan: PlanName, stripeData?: StripeData) {
  const { terminal_limit } = PLAN_LIMITS[plan]
  const update: Record<string, unknown> = { plan, terminal_limit }
  if (stripeData?.customerId)      update.stripe_customer_id = stripeData.customerId
  if (stripeData?.subscriptionId)  update.stripe_subscription_id = stripeData.subscriptionId
  if (stripeData?.priceId)         update.stripe_price_id = stripeData.priceId
  if (stripeData?.currentPeriodEnd) update.subscription_current_period_end = stripeData.currentPeriodEnd.toISOString()

  const res = await fetch(`${supabaseUrl}/rest/v1/companies?id=eq.${companyId}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(update),
  })
  return res.ok
}

export async function getCompanyPlan(companyId: string): Promise<{ plan: PlanName; terminal_limit: number | null } | null> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/companies?id=eq.${companyId}&select=plan,terminal_limit&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  if (!res.ok) return null
  const rows: { plan: string; terminal_limit: number | null }[] = await res.json()
  if (!rows.length) return null
  return { plan: rows[0].plan as PlanName, terminal_limit: rows[0].terminal_limit }
}
