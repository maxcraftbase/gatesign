-- Migration 003: RLS company_id-Isolation für Write-Policies
-- Defense-in-Depth: Schreibzugriff auf eigene Company beschränken.
-- Alle App-seitigen Writes laufen bereits über service_role (RLS-bypass),
-- aber direkte authenticated-Zugriffe werden hiermit ebenfalls abgesichert.
-- Sicher anzuwenden: verändert kein bestehendes Verhalten der App.

-- ============================================================
-- terminals: Write auf eigene Company einschränken
-- ============================================================
DROP POLICY IF EXISTS "authenticated write terminals" ON terminals;

CREATE POLICY "company write terminals"
  ON terminals FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM company_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================================
-- user_terminal_access: Write auf eigene Company einschränken
-- ============================================================
DROP POLICY IF EXISTS "authenticated write user_terminal_access" ON user_terminal_access;
DROP POLICY IF EXISTS "authenticated read user_terminal_access" ON user_terminal_access;

CREATE POLICY "company read user_terminal_access"
  ON user_terminal_access FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "company write user_terminal_access"
  ON user_terminal_access FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM company_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================================
-- check_ins: SELECT auf eigene Company einschränken
-- (check_ins hat company_id Spalte; INSERT bleibt public für Kiosk)
-- ============================================================
DROP POLICY IF EXISTS "authenticated read check_ins" ON check_ins;

CREATE POLICY "company read check_ins"
  ON check_ins FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================================
-- app_settings: Write auf eigene Company einschränken
-- (app_settings hat company_id als Teil des Primary Key)
-- ============================================================
DROP POLICY IF EXISTS "authenticated write settings" ON app_settings;

CREATE POLICY "company write settings"
  ON app_settings FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM company_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================================
-- safety_briefings: bleibt wie bisher (globale Tabelle, kein company_id)
-- Write über service_role bleibt die einzige Schreibmethode
-- ============================================================
