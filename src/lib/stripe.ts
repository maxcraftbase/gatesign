import Stripe from 'stripe'
import { env } from '@/env'
import type { PlanName } from '@/lib/subscription'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY ist nicht konfiguriert.')
  _stripe = new Stripe(key, { apiVersion: '2026-03-25.dahlia' })
  return _stripe
}

export function planFromPriceId(priceId: string | null | undefined): PlanName | null {
  if (!priceId) return null
  if (priceId === env.STRIPE_PRICE_STARTER) return 'starter'
  if (priceId === env.STRIPE_PRICE_PROFESSIONAL) return 'professional'
  if (priceId === env.STRIPE_PRICE_ENTERPRISE) return 'enterprise'
  return null
}

export function priceIdFromPlan(plan: PlanName): string | null {
  switch (plan) {
    case 'starter':      return env.STRIPE_PRICE_STARTER ?? null
    case 'professional': return env.STRIPE_PRICE_PROFESSIONAL ?? null
    case 'enterprise':   return env.STRIPE_PRICE_ENTERPRISE ?? null
  }
}

export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY)
}
