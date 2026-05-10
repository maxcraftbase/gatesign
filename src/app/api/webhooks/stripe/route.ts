// TODO: Stripe Webhook Handler
//
// Events to handle once Stripe is integrated:
//   customer.subscription.created  → applyPlan(companyId, planFromPriceId, stripeData)
//   customer.subscription.updated  → applyPlan(companyId, planFromPriceId, stripeData)
//   customer.subscription.deleted  → applyPlan(companyId, 'starter')
//
// Price ID → Plan mapping (set in Stripe dashboard):
//   STRIPE_PRICE_STARTER       → 'starter'       (€49/Monat, 1 Terminal)
//   STRIPE_PRICE_PROFESSIONAL  → 'professional'   (€99/Monat, 3 Terminals)
//   STRIPE_PRICE_ENTERPRISE    → 'enterprise'     (auf Anfrage, unbegrenzt)
//
// Setup:
//   1. npm install stripe
//   2. Add STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET to env
//   3. stripe listen --forward-to localhost:3000/api/webhooks/stripe
//   4. Implement handler using applyPlan() from @/lib/subscription

export async function POST() {
  return new Response('Stripe webhook not yet implemented', { status: 501 })
}
