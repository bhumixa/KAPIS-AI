-- ==============================================================================
-- Kapis AI Platform - Sprint 6: Users table
-- Apply manually (never auto-run), after 008_create_clinics.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/009_create_users.sql
--
-- Clinic staff accounts managed from User Management - the real backing
-- store for the day a JWT-based `AuthService` replaces Sprint 1's dummy
-- login. No `role` column here on purpose: role assignment is many-to-many
-- via 012_create_user_roles.sql, future-ready beyond today's mock UI (which
-- still treats `ClinicUser.role` as a single field for simplicity - see
-- Architecture.md for that gap being intentional).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  clinic_id      uuid NOT NULL REFERENCES clinic.clinics (id) ON DELETE CASCADE,

  name           varchar(150) NOT NULL,
  email          varchar(255) NOT NULL,
  phone          varchar(20) NOT NULL,

  status         varchar(10) NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'inactive')),

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT users_email_unique UNIQUE (email)
);

-- User Management's list search/filter (name/email) and status filter.
CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON clinic.users (clinic_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON clinic.users (status);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_users_set_updated_at ON clinic.users;
CREATE TRIGGER trg_users_set_updated_at
  BEFORE UPDATE ON clinic.users
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
