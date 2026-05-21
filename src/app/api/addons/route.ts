import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminContext } from '@/lib/admin-auth'
import { logAction } from '@/lib/audit'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { ADDON_REGISTRY, ALL_ADDON_KEYS, addonPriceId, getCompanyAddons, type AddonKey } from '@/lib/addons'
import { supabaseUrl, serviceKey } from '@/lib/supabase-server'
import type { BillingCycle } from '@/lib/subscription'

const BodySchema = z.object({
  addon: z.enum(ALL_ADDON_KEYS as [AddonKey, ...AddonKey[]]),
})

/**
 * Fügt ein Add-on zur bestehenden Subscription hinzu.
 * Setzt voraus: Company hat bereits eine Subscription (stripe_subscription_id gesetzt).
 * Stripe macht automatisch Proration.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe ist serverseitig nicht konfiguriert.' }, { status: 503 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
    }
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Ungültiges Add-on.' }, { status: 400 })

    const { addon } = parsed.data
    const def = ADDON_REGISTRY[addon]
    if (def.status !== 'active') {
      return NextResponse.json({ error: 'Dieses Add-on ist noch nicht verfügbar.' }, { status: 400 })
    }

    // Company + Subscription holen
    const compRes = await fetch(
      `${supabaseUrl}/rest/v1/companies?id=eq.${ctx.company.id}&select=stripe_subscription_id,plan,billing_cycle`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' },
    )
    const rows: { stripe_subscription_id: string | null; plan: string; billing_cycle: string | null }[] = await compRes.json()
    if (!rows.length) return NextResponse.json({ error: 'Firma nicht gefunden.' }, { status: 404 })

    const { stripe_subscription_id, plan, billing_cycle } = rows[0]
    if (!stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Bitte zuerst einen Plan wählen, bevor Sie Add-ons buchen.' },
        { status: 400 },
      )
    }

    // Wenn das Add-on im aktuellen Plan inkludiert ist, ist es eh schon „dabei"
    if (def.includedIn.includes(plan as 'solo' | 'business' | 'enterprise')) {
      return NextResponse.json(
        { error: 'Dieses Add-on ist in Ihrem Plan bereits inklusive.' },
        { status: 400 },
      )
    }

    const cycle: BillingCycle = billing_cycle === 'yearly' ? 'yearly' : 'monthly'
    const priceId = addonPriceId(addon, cycle)
    if (!priceId) {
      return NextResponse.json(
        { error: `Kein Stripe-Preis für Add-on "${addon}" (${cycle}) konfiguriert.` },
        { status: 503 },
      )
    }

    // Bereits aktiv? → 409
    const existing = await getCompanyAddons(ctx.company.id)
    if (existing.some(e => e.addon_key === addon)) {
      return NextResponse.json({ error: 'Add-on ist bereits aktiv.' }, { status: 409 })
    }

    const stripe = getStripe()
    await stripe.subscriptionItems.create({
      subscription: stripe_subscription_id,
      price: priceId,
      quantity: 1,
      proration_behavior: 'create_prorations',
    })

    // company_addons wird durch das nachfolgende customer.subscription.updated Webhook-Event befüllt.
    await logAction(ctx, 'stripe.addon.added', { addon, cycle, price_id: priceId })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[addons] POST error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

/**
 * Entfernt ein Add-on aus der bestehenden Subscription.
 */
export async function DELETE(req: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe ist serverseitig nicht konfiguriert.' }, { status: 503 })
    }

    const { searchParams } = new URL(req.url)
    const addon = searchParams.get('addon') as AddonKey | null
    if (!addon || !ALL_ADDON_KEYS.includes(addon)) {
      return NextResponse.json({ error: 'Ungültiges Add-on.' }, { status: 400 })
    }

    const rows = await getCompanyAddons(ctx.company.id)
    const row = rows.find(r => r.addon_key === addon)
    if (!row || !row.stripe_subscription_item_id) {
      return NextResponse.json({ error: 'Add-on ist nicht aktiv.' }, { status: 404 })
    }

    const stripe = getStripe()
    await stripe.subscriptionItems.del(row.stripe_subscription_item_id, {
      proration_behavior: 'create_prorations',
    })

    await logAction(ctx, 'stripe.addon.removed', { addon, item_id: row.stripe_subscription_item_id })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[addons] DELETE error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
