import Stripe from 'stripe'
import { env } from '@/env'
import type { BillingCycle, PlanName } from '@/lib/subscription'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY ist nicht konfiguriert.')
  // apiVersion bewusst weggelassen → SDK nutzt jeweils ihren Default.
  _stripe = new Stripe(key)
  return _stripe
}

export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY)
}

/**
 * Ermittelt Plan + Cycle aus einer Stripe Price-ID.
 * Akzeptiert das neue Modell (Solo/Business/Enterprise × M/Y) und Legacy-Aliasse (Starter/Professional).
 */
export function planAndCycleFromPriceId(priceId: string | null | undefined): { plan: PlanName; cycle: BillingCycle } | null {
  if (!priceId) return null

  // Neues Modell
  if (priceId === env.STRIPE_PRICE_SOLO_MONTHLY)       return { plan: 'solo',       cycle: 'monthly' }
  if (priceId === env.STRIPE_PRICE_SOLO_YEARLY)        return { plan: 'solo',       cycle: 'yearly'  }
  if (priceId === env.STRIPE_PRICE_BUSINESS_MONTHLY)   return { plan: 'business',   cycle: 'monthly' }
  if (priceId === env.STRIPE_PRICE_BUSINESS_YEARLY)    return { plan: 'business',   cycle: 'yearly'  }
  if (priceId === env.STRIPE_PRICE_ENTERPRISE_MONTHLY) return { plan: 'enterprise', cycle: 'monthly' }
  if (priceId === env.STRIPE_PRICE_ENTERPRISE_YEARLY)  return { plan: 'enterprise', cycle: 'yearly'  }

  // Legacy-Fallback (für laufende Beta-Subscriptions des alten Modells)
  if (priceId === env.STRIPE_PRICE_STARTER)      return { plan: 'solo',       cycle: 'monthly' }
  if (priceId === env.STRIPE_PRICE_PROFESSIONAL) return { plan: 'business',   cycle: 'monthly' }
  if (priceId === env.STRIPE_PRICE_ENTERPRISE)   return { plan: 'enterprise', cycle: 'monthly' }

  return null
}

/** Lookup Price-ID für eine Plan/Cycle-Kombination. */
export function basePriceId(plan: PlanName, cycle: BillingCycle): string | null {
  if (cycle === 'yearly') {
    switch (plan) {
      case 'solo':       return env.STRIPE_PRICE_SOLO_YEARLY ?? null
      case 'business':   return env.STRIPE_PRICE_BUSINESS_YEARLY ?? null
      case 'enterprise': return env.STRIPE_PRICE_ENTERPRISE_YEARLY ?? null
    }
  }
  switch (plan) {
    case 'solo':       return env.STRIPE_PRICE_SOLO_MONTHLY ?? null
    case 'business':   return env.STRIPE_PRICE_BUSINESS_MONTHLY ?? null
    case 'enterprise': return env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? null
  }
}

/** @deprecated — nur noch für Legacy-Aufrufe, neue Aufrufe sollen basePriceId(plan, cycle) nutzen. */
export function planFromPriceId(priceId: string | null | undefined): PlanName | null {
  return planAndCycleFromPriceId(priceId)?.plan ?? null
}

/** @deprecated — nur Legacy. Nutze basePriceId(plan, 'monthly'). */
export function priceIdFromPlan(plan: PlanName): string | null {
  return basePriceId(plan, 'monthly')
}
