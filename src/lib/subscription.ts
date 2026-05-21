import { supabaseUrl, serviceKey } from '@/lib/supabase-server'

/**
 * Aktive Plan-Namen (Pricing v2, Stand 2026-05-21).
 * Alte Werte 'starter'/'professional' wurden via Migration 005 auf 'solo'/'business' umgestellt.
 */
export type PlanName = 'solo' | 'business' | 'enterprise'

/** Erkennt auch Legacy-Werte aus dem alten Modell zur Defensive */
export type AnyPlanInput = PlanName | 'starter' | 'professional'

export type BillingCycle = 'monthly' | 'yearly'

export const PLAN_LIMITS: Record<PlanName, {
  terminal_limit: number | null
  location_limit: number | null
  label: string
  monthly_price: string
  yearly_price: string
}> = {
  solo:       { terminal_limit: 1,    location_limit: 1,    label: 'Solo',       monthly_price: '29 €/Monat',  yearly_price: '290 €/Jahr' },
  business:   { terminal_limit: 3,    location_limit: 3,    label: 'Business',   monthly_price: '79 €/Monat',  yearly_price: '790 €/Jahr' },
  enterprise: { terminal_limit: null, location_limit: null, label: 'Enterprise', monthly_price: 'Auf Anfrage', yearly_price: 'Auf Anfrage' },
}

/** Normalisiert Legacy-Plan-Werte auf das neue Schema. */
export function normalizePlan(plan: string | null | undefined): PlanName | null {
  if (!plan) return null
  switch (plan) {
    case 'solo':
    case 'business':
    case 'enterprise':
      return plan
    case 'starter':      return 'solo'      // Legacy-Alias
    case 'professional': return 'business'  // Legacy-Alias
    default: return null
  }
}

interface StripeData {
  customerId?: string
  subscriptionId?: string
  priceId?: string
  currentPeriodEnd?: Date
  billingCycle?: BillingCycle
}

/**
 * Setzt den Plan einer Company atomar in der DB.
 * Wird vom Stripe-Webhook (customer.subscription.created/updated) und vom Superadmin-Dashboard aufgerufen.
 */
export async function applyPlan(companyId: string, plan: PlanName, stripeData?: StripeData) {
  const { terminal_limit } = PLAN_LIMITS[plan]
  const update: Record<string, unknown> = { plan, terminal_limit }
  if (stripeData?.customerId)       update.stripe_customer_id = stripeData.customerId
  if (stripeData?.subscriptionId)   update.stripe_subscription_id = stripeData.subscriptionId
  if (stripeData?.priceId)          update.stripe_price_id = stripeData.priceId
  if (stripeData?.currentPeriodEnd) update.subscription_current_period_end = stripeData.currentPeriodEnd.toISOString()
  if (stripeData?.billingCycle)     update.billing_cycle = stripeData.billingCycle

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

export async function getCompanyPlan(companyId: string): Promise<{ plan: PlanName; terminal_limit: number | null; billing_cycle: BillingCycle } | null> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/companies?id=eq.${companyId}&select=plan,terminal_limit,billing_cycle&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  if (!res.ok) return null
  const rows: { plan: string; terminal_limit: number | null; billing_cycle: string | null }[] = await res.json()
  if (!rows.length) return null
  const plan = normalizePlan(rows[0].plan)
  if (!plan) return null
  return {
    plan,
    terminal_limit: rows[0].terminal_limit,
    billing_cycle: (rows[0].billing_cycle === 'yearly' ? 'yearly' : 'monthly') as BillingCycle,
  }
}
