-- ==============================================================================
-- Kapis AI Platform - Sprint 7: Insurance providers table
-- Apply manually (never auto-run):
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/017_create_insurance_providers.sql
--
-- Insurance providers the clinic accepts - referenced when patients ask
-- "do you take my insurance?".
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.insurance_providers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name              varchar(200) NOT NULL,
  contact_person    varchar(150) NOT NULL DEFAULT '',
  phone             varchar(20) NOT NULL DEFAULT '',
  email             varchar(255) NOT NULL DEFAULT '',
  website           text NOT NULL DEFAULT '',

  status            varchar(10) NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'inactive')),

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT insurance_providers_name_unique UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_insurance_providers_status ON clinic.insurance_providers (status);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_insurance_providers_set_updated_at ON clinic.insurance_providers;
CREATE TRIGGER trg_insurance_providers_set_updated_at
  BEFORE UPDATE ON clinic.insurance_providers
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
