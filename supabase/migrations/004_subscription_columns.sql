-- Migration 004: Trial- und Subscription-Status für Stripe-Webhook
-- Idempotent — sichere Wiederholung ohne Daten-Verlust

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Schneller Lookup vom Webhook (Customer-ID → Company)
CREATE INDEX IF NOT EXISTS idx_companies_stripe_customer
  ON companies (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
