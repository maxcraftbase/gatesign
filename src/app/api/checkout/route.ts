import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminContext } from '@/lib/admin-auth'
import { logAction } from '@/lib/audit'
import { getStripe, priceIdFromPlan, isStripeConfigured } from '@/lib/stripe'
import { supabaseUrl, serviceKey } from '@/lib/supabase-server'
import { env } from '@/env'

const BodySchema = z.object({
  plan: z.enum(['starter', 'professional', 'enterprise']),
})

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
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültiger Plan.' }, { status: 400 })
    }
    const { plan } = parsed.data

    const priceId = priceIdFromPlan(plan)
    if (!priceId) {
      return NextResponse.json({ error: `Kein Stripe-Preis für Plan "${plan}" konfiguriert.` }, { status: 503 })
    }

    // Company-Daten lesen (für Stripe-Customer + Slug)
    const companyRes = await fetch(
      `${supabaseUrl}/rest/v1/companies?id=eq.${ctx.company.id}&select=id,name,slug,stripe_customer_id`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' },
    )
    const companies: { id: string; name: string; slug: string; stripe_customer_id: string | null }[] = await companyRes.json()
    if (!companies.length) {
      return NextResponse.json({ error: 'Firma nicht gefunden.' }, { status: 404 })
    }
    const company = companies[0]

    const stripe = getStripe()

    // Stripe-Customer holen oder anlegen
    let customerId = company.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: ctx.email,
        name: company.name,
        metadata: { company_id: company.id, company_slug: company.slug },
      }, { idempotencyKey: `customer-create-${company.id}` })
      customerId = customer.id

      // Sofort in DB persistieren, damit ein zweiter Klick keinen Doppel-Customer erzeugt
      await fetch(`${supabaseUrl}/rest/v1/companies?id=eq.${company.id}`, {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ stripe_customer_id: customerId }),
      })
    }

    const appUrl = env.APP_URL.replace(/\/$/, '')
    const returnUrl = `${appUrl}/${company.slug}/admin/billing`

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl}?success=1`,
      cancel_url: `${returnUrl}?canceled=1`,
      subscription_data: {
        metadata: { company_id: company.id },
      },
      allow_promotion_codes: true,
      locale: 'de',
    })

    await logAction(ctx, 'stripe.checkout.started', { plan, price_id: priceId, session_id: session.id })

    if (!session.url) {
      return NextResponse.json({ error: 'Checkout-Session ohne URL.' }, { status: 500 })
    }
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[checkout] error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
