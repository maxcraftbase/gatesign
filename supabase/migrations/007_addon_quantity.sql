-- Migration 007: Add-on-Menge (quantity) für company_addons
-- Hintergrund: Der „Zusatz-Standort" (extra_location) soll das Terminal-Limit
-- pro gekaufter Einheit um 1 erhöhen. Stripe fasst gleiche Prices zu EINEM
-- Subscription-Item mit `quantity` zusammen — wir spiegeln das in einer Spalte.
-- Idempotent — sichere Wiederholung ohne Datenverlust.

ALTER TABLE company_addons
  ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1
    CHECK (quantity >= 1);

COMMENT ON COLUMN company_addons.quantity IS
  'Gekaufte Menge des Add-ons (Stripe subscription_item.quantity). Für extra_location = Anzahl Zusatz-Standorte; erhöht das Terminal-Limit der Company um genau diese Zahl. Andere Add-ons sind boolesche Features → quantity bleibt 1.';
