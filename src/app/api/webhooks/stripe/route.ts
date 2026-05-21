import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import type Stripe from 'stripe'
import { env } from '@/env'
import { getStripe, planFromPriceId } from '@/lib/stripe'
import { applyPlan } from '@/lib/subscription'
import { supabaseUrl, serviceKey } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function logWebhookEvent(
  action: string,
  details: Record<string, unknown>,
  companyId?: string,
) {
  try {
    await fetch(`${supabaseUrl}/rest/v1/audit_log`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        company_id: companyId ?? null,
        user_id: null,
        user_email: 'stripe-webhook',
        action,
        details,
      }),
    })
  } catch (err) {
    console.error('[stripe-webhook] audit log error:', err)
    Sentry.captureException(err)
  }
}

async function updateCompanyByCustomerId(
  customerId: string,
  patch: Record<string, unknown>,
): Promise<string | null> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/companies?stripe_customer_id=eq.${customerId}&select=id`,
    {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(patch),
    },
  )
  if (!res.ok) return null
  const rows: { id: string }[] = await res.json()
  return rows[0]?.id ?? null
}

function getCompanyIdFromSubscription(sub: Stripe.Subscription): string | null {
  const fromMeta = sub.metadata?.company_id
  if (fromMeta && typeof fromMeta === 'string') return fromMeta
  return null
}

async function handleSubscriptionUpserted(sub: Stripe.Subscription, eventId: string) {
  const companyId = getCompanyIdFromSubscription(sub)
  const item = sub.items.data[0]
  const priceId = item?.price.id ?? null
  const plan = planFromPriceId(priceId)
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const periodEndSec = item?.current_period_end ?? null
  const currentPeriodEnd = periodEndSec ? new Date(periodEndSec * 1000) : undefined
  const status = sub.status

  if (!companyId) {
    await logWebhookEvent('stripe.webhook.unmatched_subscription', {
      event_id: eventId,
      subscription_id: sub.id,
      customer_id: customerId,
      reason: 'no company_id in metadata',
    })
    return
  }
  if (!plan) {
    await logWebhookEvent('stripe.webhook.unknown_price', {
      event_id: eventId,
      subscription_id: sub.id,
      price_id: priceId,
    }, companyId)
    return
  }

  await applyPlan(companyId, plan, {
    customerId,
    subscriptionId: sub.id,
    priceId: priceId ?? undefined,
    currentPeriodEnd,
  })

  // subscription_status separat schreiben (nicht Teil von applyPlan)
  await fetch(`${supabaseUrl}/rest/v1/companies?id=eq.${companyId}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ subscription_status: status }),
  })

  await logWebhookEvent('stripe.subscription.upserted', {
    event_id: eventId,
    subscription_id: sub.id,
    plan,
    status,
    price_id: priceId,
    current_period_end: currentPeriodEnd?.toISOString(),
  }, companyId)
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription, eventId: string) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const patch = {
    plan: 'starter',
    terminal_limit: 1,
    subscription_status: 'canceled',
    stripe_subscription_id: null,
  }

  let companyId = getCompanyIdFromSubscription(sub)

  if (companyId) {
    await fetch(`${supabaseUrl}/rest/v1/companies?id=eq.${companyId}`, {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(patch),
    })
  } else {
    companyId = await updateCompanyByCustomerId(customerId, patch)
  }

  if (!companyId) {
    await logWebhookEvent('stripe.webhook.unmatched_subscription', {
      event_id: eventId,
      subscription_id: sub.id,
      customer_id: customerId,
      reason: 'deleted — no company match',
    })
    return
  }

  await logWebhookEvent('stripe.subscription.deleted', {
    event_id: eventId,
    subscription_id: sub.id,
  }, companyId)
}

export async function POST(req: NextRequest) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  // RAW Body — niemals req.json() vor constructEvent, sonst falscher Hash
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpserted(event.data.object as Stripe.Subscription, event.id)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, event.id)
        break

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id ?? null
        await logWebhookEvent('stripe.invoice.payment_failed', {
          event_id: event.id,
          invoice_id: invoice.id,
          customer_id: customerId,
          amount_due: invoice.amount_due,
        })
        break
      }

      default:
        // Andere Events ignorieren wir bewusst (z. B. customer.created, invoice.paid)
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[stripe-webhook] handler error:', err)
    Sentry.withScope(scope => {
      scope.setExtras({ event_id: event.id, event_type: event.type })
      Sentry.captureException(err)
    })
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }
}
