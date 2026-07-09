-- ==============================================================================
-- Kapis AI Platform - Sprint 7: Services table
-- Apply manually (never auto-run):
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/013_create_services.sql
--
-- Billable services the clinic offers - the future AI/WhatsApp receptionist
-- quotes these (name, duration, price) when a patient asks "what do you
-- offer" or "how much does X cost". No `clinic_id` column: like doctors/
-- patients/appointments (002/006/007), this table assumes a single-clinic
-- deployment; only `clinic.users` (009+) took on multi-clinic-ready FKs,
-- and that was scoped to the auth/role work, not knowledge-base content.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.services (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name               varchar(200) NOT NULL,
  category           varchar(100) NOT NULL,
  description        text NOT NULL DEFAULT '',
  duration_minutes   smallint NOT NULL CHECK (duration_minutes > 0),
  price              numeric(10, 2) NOT NULL CHECK (price >= 0),

  status             varchar(10) NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'inactive')),

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_category ON clinic.services (category);
CREATE INDEX IF NOT EXISTS idx_services_status ON clinic.services (status);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_services_set_updated_at ON clinic.services;
CREATE TRIGGER trg_services_set_updated_at
  BEFORE UPDATE ON clinic.services
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
