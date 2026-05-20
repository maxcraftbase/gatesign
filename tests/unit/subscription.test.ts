/**
 * Tests für @/lib/subscription
 *
 * Deckt ab:
 *   - PLAN_LIMITS: Plan-Definitionen konsistent (kritisch für UI + Stripe-Mapping)
 *   - applyPlan: PATCH-Aufruf gegen Supabase mit korrektem Body
 */

import { describe, it, expect, vi } from 'vitest'
import { PLAN_LIMITS, applyPlan } from '@/lib/subscription'

describe('PLAN_LIMITS', () => {
  it('enthält genau die drei Pläne starter/professional/enterprise', () => {
    expect(Object.keys(PLAN_LIMITS).sort()).toEqual([
      'enterprise',
      'professional',
      'starter',
    ])
  })

  it('starter und professional haben numerische terminal_limits, enterprise null (unbegrenzt)', () => {
    expect(PLAN_LIMITS.starter.terminal_limit).toBe(1)
    expect(PLAN_LIMITS.professional.terminal_limit).toBe(3)
    expect(PLAN_LIMITS.enterprise.terminal_limit).toBeNull()
  })

  it('jeder Plan hat Label und Price (für Superadmin-UI)', () => {
    for (const plan of Object.values(PLAN_LIMITS)) {
      expect(plan.label).toBeTruthy()
      expect(plan.price).toBeTruthy()
    }
  })
})

describe('applyPlan', () => {
  it('schickt PATCH an Supabase mit plan + terminal_limit', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(null, { status: 204 }),
    )
    global.fetch = fetchSpy as unknown as typeof fetch

    const ok = await applyPlan('company-123', 'professional')

    expect(ok).toBe(true)
    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/rest/v1/companies?id=eq.company-123')
    expect(init.method).toBe('PATCH')
    const body = JSON.parse(init.body)
    expect(body).toMatchObject({ plan: 'professional', terminal_limit: 3 })
  })

  it('setzt terminal_limit auf null für enterprise', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(null, { status: 204 }),
    )
    global.fetch = fetchSpy as unknown as typeof fetch

    await applyPlan('c1', 'enterprise')

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body)
    expect(body.terminal_limit).toBeNull()
  })

  it('schreibt Stripe-Felder mit, wenn übergeben (für Webhook-Pfad)', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(null, { status: 204 }),
    )
    global.fetch = fetchSpy as unknown as typeof fetch

    await applyPlan('c1', 'starter', {
      customerId: 'cus_abc',
      subscriptionId: 'sub_xyz',
      priceId: 'price_1',
      currentPeriodEnd: new Date('2026-12-31T00:00:00Z'),
    })

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body)
    expect(body).toMatchObject({
      plan: 'starter',
      stripe_customer_id: 'cus_abc',
      stripe_subscription_id: 'sub_xyz',
      stripe_price_id: 'price_1',
      subscription_current_period_end: '2026-12-31T00:00:00.000Z',
    })
  })

  it('returnt false wenn Supabase-Call scheitert', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('boom', { status: 500 }),
    ) as unknown as typeof fetch

    expect(await applyPlan('c1', 'starter')).toBe(false)
  })
})
