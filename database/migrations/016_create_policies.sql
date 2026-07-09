-- ==============================================================================
-- Kapis AI Platform - Sprint 7: Policies table
-- Apply manually (never auto-run):
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/016_create_policies.sql
--
-- Clinic policy documents (cancellation, refund, privacy, ...) the future
-- AI/WhatsApp modules can quote verbatim when a patient asks about them.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.policies (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  title        varchar(200) NOT NULL,
  type         varchar(20) NOT NULL
                 CHECK (type IN (
                   'cancellation', 'refund', 'privacy', 'appointment', 'payment', 'insurance'
                 )),
  content      text NOT NULL,

  status       varchar(10) NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'inactive')),

  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_policies_type ON clinic.policies (type);
CREATE INDEX IF NOT EXISTS idx_policies_status ON clinic.policies (status);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_policies_set_updated_at ON clinic.policies;
CREATE TRIGGER trg_policies_set_updated_at
  BEFORE UPDATE ON clinic.policies
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
