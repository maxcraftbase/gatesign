-- Migration 001: Multi-Terminal-Support + Stripe-ready Abo-Modell
-- Für bestehende Produktions-Instanzen ausführen (Supabase SQL Editor)

-- 1. Neue Tabelle: terminals
CREATE TABLE IF NOT EXISTS terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, slug)
);

-- 2. Neue Tabelle: Mitarbeiter-Terminal-Zuweisung
CREATE TABLE IF NOT EXISTS user_terminal_access (
  user_id UUID NOT NULL,
  terminal_id UUID NOT NULL REFERENCES terminals(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  PRIMARY KEY (user_id, terminal_id)
);

-- 3. check_ins: terminal_id ergänzen
ALTER TABLE check_ins
  ADD COLUMN IF NOT EXISTS terminal_id UUID REFERENCES terminals(id) ON DELETE SET NULL;

-- 4. companies: Plan-Spalten ergänzen (Stripe-ready)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS terminal_limit INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

-- 5. Bestehende Firmen: je einen Default-Terminal anlegen
-- Slug = company slug, Name = company name + " Terminal"
INSERT INTO terminals (company_id, name, slug, is_active, sort_order)
SELECT id, name || ' Terminal', slug, true, 0
FROM companies
WHERE id NOT IN (SELECT company_id FROM terminals)
ON CONFLICT (company_id, slug) DO NOTHING;

-- 6. RLS
ALTER TABLE terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_terminal_access ENABLE ROW LEVEL SECURITY;

-- Terminals: public read (Kiosk-Lookup), authenticated write
CREATE POLICY "public read terminals"
  ON terminals FOR SELECT USING (true);

CREATE POLICY "authenticated write terminals"
  ON terminals FOR ALL USING (auth.role() = 'authenticated');

-- user_terminal_access: authenticated only
CREATE POLICY "authenticated read user_terminal_access"
  ON user_terminal_access FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated write user_terminal_access"
  ON user_terminal_access FOR ALL USING (auth.role() = 'authenticated');
