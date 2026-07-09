-- ==============================================================================
-- Kapis AI Platform - Sprint 6: Roles table
-- Apply manually (never auto-run), after 008_create_clinics.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/010_create_roles.sql
--
-- The three built-in roles (admin, receptionist, doctor) plus room for a
-- clinic to define its own later - `name` is a plain varchar, not a CHECK-
-- constrained enum like `doctors.gender`, specifically so custom roles don't
-- need a schema migration to add. Seeding the three built-in roles is data,
-- not schema, so it belongs in `database/seed/` (per DevelopmentGuide.md),
-- not here - this migration only defines the shape.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.roles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  clinic_id      uuid NOT NULL REFERENCES clinic.clinics (id) ON DELETE CASCADE,

  name           varchar(50) NOT NULL,
  description    text NOT NULL DEFAULT '',

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT roles_clinic_name_unique UNIQUE (clinic_id, name)
);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_roles_set_updated_at ON clinic.roles;
CREATE TRIGGER trg_roles_set_updated_at
  BEFORE UPDATE ON clinic.roles
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
