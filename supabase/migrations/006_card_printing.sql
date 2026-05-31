-- Migration 006: Drucker-Add-on — Tagesnummer-Sequenz, Karten-Felder, Print-Bridges, Print-Jobs
-- Voraussetzung für Phase 0-N des Drucker-Add-on (siehe ADDON_REGISTRY.printer in src/lib/addons.ts)
-- Idempotent — sichere Wiederholung ohne Datenverlust

-- ============================================================================
-- 1. Tagesnummer-Sequenz pro Terminal pro Tag
-- ============================================================================
-- Eine eigene Sequenz für jede Kombination (company_id, terminal_id, card_date).
-- Reset um Mitternacht passiert automatisch, weil card_date Teil des Primary-Keys ist.
-- Bei Konflikt = Update via INSERT ... ON CONFLICT in der Function (atomar dank Postgres).
CREATE TABLE IF NOT EXISTS daily_card_sequences (
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  terminal_id   UUID NOT NULL REFERENCES terminals(id) ON DELETE CASCADE,
  card_date     DATE NOT NULL,
  next_number   INT  NOT NULL DEFAULT 1,
  PRIMARY KEY (company_id, terminal_id, card_date)
);

-- ============================================================================
-- 2. Postgres-Function: Tagesnummer atomar ziehen
-- ============================================================================
-- INSERT ... ON CONFLICT garantiert atomare Nummern-Vergabe ohne SELECT FOR UPDATE.
-- Bei Erst-Insert wird next_number=2 gesetzt und 1 zurückgegeben (also: erste Karte = 1).
-- Bei Folge-Inserts wird next_number+=1 und der alte Wert zurückgegeben.
-- card_date wird explizit übergeben, damit Tagesübergangs-Bugs ausgeschlossen sind
-- (Caller fixiert das Datum, Insert in check_ins nutzt dasselbe Datum als card_date).
CREATE OR REPLACE FUNCTION allocate_card_number(
  p_company  UUID,
  p_terminal UUID,
  p_date     DATE
) RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_number INT;
BEGIN
  INSERT INTO daily_card_sequences (company_id, terminal_id, card_date, next_number)
  VALUES (p_company, p_terminal, p_date, 2)
  ON CONFLICT (company_id, terminal_id, card_date) DO UPDATE
    SET next_number = daily_card_sequences.next_number + 1
  RETURNING next_number - 1 INTO v_number;

  RETURN v_number;
END;
$$;

COMMENT ON FUNCTION allocate_card_number(UUID, UUID, DATE) IS
  'Atomar nächste Tagesnummer für (company, terminal, date) ziehen. Reset täglich um 00:00 automatisch. Lücken in der Sequenz akzeptabel (Nummer ist Identifier, kein Audit-Wert).';

-- ============================================================================
-- 3. check_ins um Karten-Felder erweitern
-- ============================================================================
-- card_number: Tagesnummer am Terminal (1..999, theoretisch unbegrenzt)
-- card_date:   explizites Datum der Nummern-Vergabe (vermeidet Mismatch mit created_at bei Tagesübergang)
-- checked_out_at: gesetzt beim Abmelden via Tagesnummer ODER vom Auto-Close-Cron
-- checkout_method: 'card_number' (Self-Service) | 'admin' (manuell) | 'auto_close' (Cron)
ALTER TABLE check_ins
  ADD COLUMN IF NOT EXISTS card_number     INT,
  ADD COLUMN IF NOT EXISTS card_date       DATE,
  ADD COLUMN IF NOT EXISTS checked_out_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS checkout_method TEXT
    CHECK (checkout_method IS NULL OR checkout_method IN ('card_number', 'admin', 'auto_close'));

-- Partial Index für schnellen Lookup offener Karten beim Checkout
-- (Besucher tippt Nummer ein, wir suchen open check_in für diese company/card_number)
CREATE INDEX IF NOT EXISTS idx_check_ins_open_card
  ON check_ins (company_id, card_number)
  WHERE checked_out_at IS NULL AND card_number IS NOT NULL;

-- Index für Admin-UI: Anwesende pro Terminal listen
CREATE INDEX IF NOT EXISTS idx_check_ins_open_per_terminal
  ON check_ins (terminal_id, card_date DESC)
  WHERE checked_out_at IS NULL AND card_number IS NOT NULL;

-- ============================================================================
-- 4. Print-Bridges (lokaler Print-Service im Kunden-LAN)
-- ============================================================================
-- Eine Bridge gehört genau zu einem Terminal (UNIQUE constraint).
-- Pairing-Flow: Admin generiert Code → Bridge sendet Code beim ersten Start →
-- Backend tauscht Code gegen API-Token (bcrypt-hashed, niemals plaintext in DB).
CREATE TABLE IF NOT EXISTS print_bridges (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  terminal_id         UUID NOT NULL UNIQUE REFERENCES terminals(id) ON DELETE CASCADE,
  display_name        TEXT,                                     -- z.B. "Drucker Empfang Nord"
  pairing_code        TEXT,                                     -- 8-stellig alphanum, NULL nach erfolgreicher Pairung
  pairing_expires_at  TIMESTAMPTZ,                              -- TTL 10 min
  api_token_hash      TEXT,                                     -- SHA-256-hex des API-Tokens, persistiert nach Pairing
  printer_target      TEXT,                                     -- 'usb' oder 'tcp:192.168.x.x:9100'
  printer_model       TEXT DEFAULT 'QL-820NWB',                 -- brother_ql Modell-Identifier
  status              TEXT NOT NULL DEFAULT 'offline'
    CHECK (status IN ('offline', 'online', 'paper_out', 'error')),
  last_seen           TIMESTAMPTZ,
  last_error          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_print_bridges_company
  ON print_bridges (company_id);

CREATE INDEX IF NOT EXISTS idx_print_bridges_pairing
  ON print_bridges (pairing_code)
  WHERE pairing_code IS NOT NULL;

-- Direkt-Lookup für Bridge-Auth: api_token_hash = SHA-256(token), indexiert.
-- Ersetzt den früheren O(n)-bcrypt-Scan über alle Bridges (siehe authenticateBridge).
CREATE INDEX IF NOT EXISTS idx_print_bridges_token
  ON print_bridges (api_token_hash)
  WHERE api_token_hash IS NOT NULL;

-- ============================================================================
-- 5. Print-Jobs (Queue zwischen Backend und Bridge)
-- ============================================================================
-- Bridge pollt alle 3s mit GET /api/print-agent/jobs.
-- Atomic Pickup via UPDATE ... WHERE id = (SELECT ... LIMIT 1) — verhindert Doppeldruck.
-- PNG wird inline als base64 mitgegeben (typisch 20-40 KB pro Karte, kein Storage-Roundtrip).
-- Cleanup-Cron löscht Jobs > 24h.
CREATE TABLE IF NOT EXISTS print_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bridge_id       UUID NOT NULL REFERENCES print_bridges(id) ON DELETE CASCADE,
  check_in_id     UUID NOT NULL REFERENCES check_ins(id) ON DELETE CASCADE,
  png_base64      TEXT NOT NULL,                                -- Karten-PNG inline
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'printed', 'failed')),
  pickup_token    TEXT,                                         -- Idempotency-Key bei Bridge-Pickup
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  picked_up_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  error_message   TEXT
);

CREATE INDEX IF NOT EXISTS idx_print_jobs_pending
  ON print_jobs (bridge_id, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_print_jobs_sent
  ON print_jobs (bridge_id, picked_up_at)
  WHERE status = 'sent';

-- ============================================================================
-- 6. Row-Level-Security — bewusst Service-Role-only
-- ============================================================================
-- WICHTIG: KEINE authenticated-Read-Policy auf diesen Tabellen.
-- Eine "auth.role() = 'authenticated'"-SELECT-Policy ohne company_id-Scope wäre
-- cross-tenant: jeder eingeloggte User könnte mit seinem eigenen JWT die Bridges
-- ALLER Firmen lesen — inkl. pairing_code (Klartext, 10 min gültig) und
-- printer_target (interne IP). Da /api/print-agent/pair öffentlich ist, könnte
-- damit eine fremde Bridge gekapert werden. Deshalb lesen Admin-Views diese
-- Tabellen ausschließlich über das Backend mit Service-Role-Key (+ expliziter
-- company_id-Filter), niemals direkt mit dem User-JWT.
ALTER TABLE daily_card_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_bridges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs           ENABLE ROW LEVEL SECURITY;

-- Falls eine frühere Version dieser Migration die zu offenen Policies bereits
-- angelegt hat: hier explizit entfernen (idempotent).
DROP POLICY IF EXISTS "authenticated read daily_card_sequences" ON daily_card_sequences;
DROP POLICY IF EXISTS "authenticated read print_bridges"        ON print_bridges;

DROP POLICY IF EXISTS "service write daily_card_sequences" ON daily_card_sequences;
CREATE POLICY "service write daily_card_sequences"
  ON daily_card_sequences FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service write print_bridges" ON print_bridges;
CREATE POLICY "service write print_bridges"
  ON print_bridges FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service all print_jobs" ON print_jobs;
CREATE POLICY "service all print_jobs"
  ON print_jobs FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 7. Updated-At Trigger für print_bridges (Pattern wie company_addons)
-- ============================================================================
CREATE OR REPLACE FUNCTION set_print_bridges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_print_bridges_updated_at ON print_bridges;
CREATE TRIGGER trg_print_bridges_updated_at
  BEFORE UPDATE ON print_bridges
  FOR EACH ROW EXECUTE FUNCTION set_print_bridges_updated_at();

-- ============================================================================
-- 8. Dokumentations-Kommentare
-- ============================================================================
COMMENT ON TABLE daily_card_sequences IS
  'Tagesnummer-Sequenz pro Terminal pro Tag. Reset um Mitternacht automatisch durch card_date als Teil des PK.';
COMMENT ON TABLE print_bridges IS
  'Print-Bridge = Node-Service im Kunden-LAN, der die Druckjobs an den USB/TCP-Drucker weiterleitet. 1:1 mit terminal_id verbunden.';
COMMENT ON TABLE print_jobs IS
  'Druckjob-Queue. Bridge pollt mit kurzem Polling (3s) via /api/print-agent/jobs. PNG inline als base64, kein Storage-Roundtrip. Cleanup nach 24h.';
COMMENT ON COLUMN check_ins.card_date IS
  'Datum der Karten-Vergabe (= daily_card_sequences.card_date). Explizit, um Tagesübergangs-Bugs zwischen Allokation und Insert zu vermeiden.';
COMMENT ON COLUMN check_ins.checkout_method IS
  'card_number = Self-Service am Terminal (Tagesnummer eingegeben). admin = manuell via Admin-UI. auto_close = vom Cron um 23:55 geschlossen.';
COMMENT ON COLUMN print_bridges.api_token_hash IS
  'SHA-256-Hash (hex) des API-Tokens. Token ist ein 128-bit-Random-UUID → SHA-256 ohne Salt ausreichend (kein Brute-Force-Risiko bei High-Entropy-Input), erlaubt indexierten Direkt-Lookup. Token selbst wird einmal beim Pairing zurückgegeben und nie wieder.';
COMMENT ON COLUMN print_jobs.pickup_token IS
  'Idempotency-Key. Bridge sendet diesen bei Status-Updates, sodass ein Doppel-Pickup (Bridge-Restart) keinen Doppeldruck verursacht.';
