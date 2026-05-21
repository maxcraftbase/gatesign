import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { logAction } from '@/lib/audit'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { supabaseUrl, serviceKey } from '@/lib/supabase-server'
import { env } from '@/env'

export async function POST() {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe ist serverseitig nicht konfiguriert.' }, { status: 503 })
    }

    const companyRes = await fetch(
      `${supabaseUrl}/rest/v1/companies?id=eq.${ctx.company.id}&select=slug,stripe_customer_id`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' },
    )
    const rows: { slug: string; stripe_customer_id: string | null }[] = await companyRes.json()
    if (!rows.length) return NextResponse.json({ error: 'Firma nicht gefunden.' }, { status: 404 })

    const { slug, stripe_customer_id: customerId } = rows[0]
    if (!customerId) {
      return NextResponse.json({ error: 'Kein Stripe-Kunde verknüpft. Bitte zuerst einen Plan wählen.' }, { status: 400 })
    }

    const appUrl = env.APP_URL.replace(/\/$/, '')
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/${slug}/admin/billing`,
    })

    await logAction(ctx, 'stripe.portal.opened', { session_id: session.id })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[customer-portal] error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
