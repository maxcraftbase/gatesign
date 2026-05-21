import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin-auth'
import { SettingsSubNav } from '@/components/admin/SettingsSubNav'
import { supabaseUrl, serviceKey } from '@/lib/supabase-server'
import { isStripeConfigured } from '@/lib/stripe'
import { BillingClient, type BillingCompanyState } from './BillingClient'

export const dynamic = 'force-dynamic'

interface CompanyRow {
  plan: string | null
  terminal_limit: number | null
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

  const res = await fetch(
    `${supabaseUrl}/rest/v1/companies?id=eq.${ctx.company.id}&select=plan,terminal_limit,subscription_status,trial_ends_at,subscription_current_period_end,stripe_customer_id,stripe_subscription_id`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' },
  )
  const rows: CompanyRow[] = res.ok ? await res.json() : []
  const company = rows[0]

  const state: BillingCompanyState = {
    plan: (company?.plan as BillingCompanyState['plan']) ?? 'starter',
    subscriptionStatus: company?.subscription_status ?? 'trial',
    trialEndsAt: company?.trial_ends_at ?? null,
    currentPeriodEnd: company?.subscription_current_period_end ?? null,
    hasStripeCustomer: Boolean(company?.stripe_customer_id),
    hasActiveSubscription: Boolean(company?.stripe_subscription_id),
  }

  return (
    <>
      <SettingsSubNav slug={slug} />
      <BillingClient
        state={state}
        stripeReady={isStripeConfigured()}
        successFlag={sp.success === '1'}
        canceledFlag={sp.canceled === '1'}
      />
    </>
  )
}
