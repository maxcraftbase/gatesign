-- Migration 005: Modulares Pricing — company_addons + billing_cycle
-- Voraussetzung für Phase B.2 (Solo/Business/Enterprise + 6 Add-ons + Monatlich/Jährlich)
-- Idempotent — sichere Wiederholung ohne Datenverlust

-- 1. companies um billing_cycle erweitern
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'yearly'));

-- 2. Neue Tabelle company_addons: aktive Add-ons pro Company
CREATE TABLE IF NOT EXISTS company_addons (
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  addon_key TEXT NOT NULL,
  stripe_subscription_item_id TEXT,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'yearly')),
  active_since TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, addon_key)
);

-- Index für Webhook-Lookup über Stripe-Item-ID
CREATE INDEX IF NOT EXISTS idx_company_addons_item
  ON company_addons (stripe_subscription_item_id)
  WHERE stripe_subscription_item_id IS NOT NULL;

-- 3. RLS für company_addons (analog zu anderen Multi-Tenant-Tabellen)
ALTER TABLE company_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read company_addons" ON company_addons;
CREATE POLICY "authenticated read company_addons"
  ON company_addons FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "service write company_addons" ON company_addons;
CREATE POLICY "service write company_addons"
  ON company_addons FOR ALL USING (auth.role() = 'service_role');

-- 4. Plan-Namen migrieren: starter→solo, professional→business
-- Sicher, weil DB-Spalte TEXT und Defaults der alten Migration auf 'starter' standen
UPDATE companies SET plan = 'solo'     WHERE plan = 'starter';
UPDATE companies SET plan = 'business' WHERE plan = 'professional';

-- 5. Default umstellen damit neue Companies auf solo starten (statt starter)
ALTER TABLE companies ALTER COLUMN plan SET DEFAULT 'solo';

-- 6. Kommentare zur Dokumentation
COMMENT ON TABLE company_addons IS
  'Aktive Add-ons pro Company. Wird vom Stripe-Webhook bei customer.subscription.updated synchronisiert. addon_key entspricht ADDON_REGISTRY in src/lib/addons.ts.';
COMMENT ON COLUMN company_addons.stripe_subscription_item_id IS
  'Die Subscription-Item-ID aus Stripe — nötig um beim Entfernen subscription_item.delete aufzurufen.';
COMMENT ON COLUMN companies.billing_cycle IS
  'monthly oder yearly. Konsistent für Base-Plan + alle Add-ons in derselben Subscription.';
COMMENT ON COLUMN companies.plan IS
  'solo | business | enterprise (seit Migration 005). Alte Werte starter/professional wurden auf solo/business migriert.';
