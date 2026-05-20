-- 003_avv_signing.sql
-- Adds columns to `companies` for click-wrap acceptance of
-- Datenschutz/Nutzungsbedingungen and electronic AVV signing
-- (Auftragsverarbeitungsvertrag nach Art. 28 DSGVO).
--
-- Existing rows keep all new columns NULL: they show an "AVV
-- noch unterzeichnen"-Banner in the admin until they sign.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_accepted_ip TEXT,
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS avv_version TEXT,
  ADD COLUMN IF NOT EXISTS avv_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS avv_signer_name TEXT,
  ADD COLUMN IF NOT EXISTS avv_signer_role TEXT,
  ADD COLUMN IF NOT EXISTS avv_company_address TEXT,
  ADD COLUMN IF NOT EXISTS avv_company_register_no TEXT,
  ADD COLUMN IF NOT EXISTS avv_signature_data TEXT, -- base64 PNG (data:image/png;base64,...)
  ADD COLUMN IF NOT EXISTS avv_signature_ip TEXT,
  ADD COLUMN IF NOT EXISTS avv_signature_user_agent TEXT;

-- Partial index for the admin-banner check: cheap lookup of
-- companies whose AVV is still missing.
CREATE INDEX IF NOT EXISTS idx_companies_avv_unsigned
  ON companies (id) WHERE avv_signed_at IS NULL;

COMMENT ON COLUMN companies.terms_accepted_at IS 'When the operator clicked the Datenschutz/Nutzungsbedingungen checkbox during onboarding.';
COMMENT ON COLUMN companies.avv_signed_at IS 'When the AVV (Art. 28 DSGVO) was electronically signed.';
COMMENT ON COLUMN companies.avv_signature_data IS 'Base64-encoded PNG of the click-wrap signature drawn on the signature pad.';
