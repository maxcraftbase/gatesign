/**
 * Tests für @/lib/subscription (Pricing v2)
 *
 * Deckt ab:
 *   - PLAN_LIMITS: Plan-Definitionen konsistent (kritisch für UI + Stripe-Mapping)
 *   - normalizePlan: Legacy-Aliasse (starter/professional) sauber gemappt
 *   - applyPlan: PATCH-Aufruf gegen Supabase mit korrektem Body
 */

import { describe, it, expect, vi } from 'vitest'
import { PLAN_LIMITS, applyPlan, normalizePlan } from '@/lib/subscription'

describe('PLAN_LIMITS', () => {
  it('enthält genau die drei Pläne solo/business/enterprise', () => {
    expect(Object.keys(PLAN_LIMITS).sort()).toEqual([
      'business',
      'enterprise',
      'solo',
    ])
  })

  it('solo und business haben numerische terminal_limits, enterprise null (unbegrenzt)', () => {
    expect(PLAN_LIMITS.solo.terminal_limit).toBe(1)
    expect(PLAN_LIMITS.business.terminal_limit).toBe(3)
    expect(PLAN_LIMITS.enterprise.terminal_limit).toBeNull()
  })

  it('solo und business haben numerische location_limits, enterprise null', () => {
    expect(PLAN_LIMITS.solo.location_limit).toBe(1)
    expect(PLAN_LIMITS.business.location_limit).toBe(3)
    expect(PLAN_LIMITS.enterprise.location_limit).toBeNull()
  })

  it('jeder Plan hat Label und Monatly/Yearly Price (für Superadmin-UI)', () => {
    for (const plan of Object.values(PLAN_LIMITS)) {
      expect(plan.label).toBeTruthy()
      expect(plan.monthly_price).toBeTruthy()
      expect(plan.yearly_price).toBeTruthy()
    }
  })
})

describe('normalizePlan', () => {
  it('mappt legacy starter → solo', () => {
    expect(normalizePlan('starter')).toBe('solo')
  })

  it('mappt legacy professional → business', () => {
    expect(normalizePlan('professional')).toBe('business')
  })

  it('lässt enterprise unverändert', () => {
    expect(normalizePlan('enterprise')).toBe('enterprise')
  })

  it('akzeptiert neue Plan-Namen', () => {
    expect(normalizePlan('solo')).toBe('solo')
    expect(normalizePlan('business')).toBe('business')
  })

  it('returnt null für unbekannte Werte', () => {
    expect(normalizePlan('unknown')).toBeNull()
    expect(normalizePlan(null)).toBeNull()
    expect(normalizePlan(undefined)).toBeNull()
    expect(normalizePlan('')).toBeNull()
  })
})

describe('applyPlan', () => {
  it('schickt PATCH an Supabase mit plan + terminal_limit', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(null, { status: 204 }),
    )
    global.fetch = fetchSpy as unknown as typeof fetch

    const ok = await applyPlan('company-123', 'business')

    expect(ok).toBe(true)
    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/rest/v1/companies?id=eq.company-123')
    expect(init.method).toBe('PATCH')
    const body = JSON.parse(init.body)
    expect(body).toMatchObject({ plan: 'business', terminal_limit: 3 })
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

    await applyPlan('c1', 'solo', {
      customerId: 'cus_abc',
      subscriptionId: 'sub_xyz',
      priceId: 'price_1',
      currentPeriodEnd: new Date('2026-12-31T00:00:00Z'),
      billingCycle: 'yearly',
    })

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body)
    expect(body).toMatchObject({
      plan: 'solo',
      stripe_customer_id: 'cus_abc',
      stripe_subscription_id: 'sub_xyz',
      stripe_price_id: 'price_1',
      subscription_current_period_end: '2026-12-31T00:00:00.000Z',
      billing_cycle: 'yearly',
    })
  })

  it('returnt false wenn Supabase-Call scheitert', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('boom', { status: 500 }),
    ) as unknown as typeof fetch

    expect(await applyPlan('c1', 'solo')).toBe(false)
  })
})
