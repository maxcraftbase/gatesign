import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin-auth'
import { supabaseUrl, serviceKey } from '@/lib/supabase-server'
import { isStripeConfigured } from '@/lib/stripe'
import { normalizePlan, type PlanName, type BillingCycle } from '@/lib/subscription'
import { getCompanyAddons, type AddonKey } from '@/lib/addons'
import { BillingClient, type BillingCompanyState } from './BillingClient'

export const dynamic = 'force-dynamic'

interface CompanyRow {
  plan: string | null
  terminal_limit: number | null
  billing_cycle: string | null
  subscription_status: string | null
  trial_ends_at: string | null
  subscription_current_period_end: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ success?: string; canceled?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const ctx = await getAdminContext()
  if (!ctx) redirect(`/${slug}/admin/login`)
  if (ctx.role !== 'admin') redirect(`/${slug}/admin`)

  const [companyRes, addonRows] = await Promise.all([
    fetch(
      `${supabaseUrl}/rest/v1/companies?id=eq.${ctx.company.id}&select=plan,terminal_limit,billing_cycle,subscription_status,trial_ends_at,subscription_current_period_end,stripe_customer_id,stripe_subscription_id`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' },
    ),
    getCompanyAddons(ctx.company.id),
  ])
  const rows: CompanyRow[] = companyRes.ok ? await companyRes.json() : []
  const company = rows[0]

  const plan: PlanName = normalizePlan(company?.plan) ?? 'solo'
  const cycle: BillingCycle = company?.billing_cycle === 'yearly' ? 'yearly' : 'monthly'

  const state: BillingCompanyState = {
    plan,
    cycle,
    subscriptionStatus: company?.subscription_status ?? 'trial',
    trialEndsAt: company?.trial_ends_at ?? null,
    currentPeriodEnd: company?.subscription_current_period_end ?? null,
    hasStripeCustomer: Boolean(company?.stripe_customer_id),
    hasActiveSubscription: Boolean(company?.stripe_subscription_id),
    activeAddons: addonRows.map(r => r.addon_key as AddonKey),
  }

  return (
    <BillingClient
      state={state}
      stripeReady={isStripeConfigured()}
      successFlag={sp.success === '1'}
      canceledFlag={sp.canceled === '1'}
    />
  )
}
