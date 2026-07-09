-- ==============================================================================
-- Kapis AI Platform - Sprint 6: Permissions table
-- Apply manually (never auto-run), after 010_create_roles.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/011_create_permissions.sql
--
-- The reusable permission model: one row per (role, module), each carrying
-- its own View/Create/Update/Delete flags - the same "one row per (entity,
-- category)" shape `doctor_schedules` established in Sprint 3 for a weekly
-- grid, applied here to a role x module grid instead of a JSON blob per
-- role. Mirrors the Angular `RolePermission` model exactly.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.permissions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  role_id        uuid NOT NULL REFERENCES clinic.roles (id) ON DELETE CASCADE,
  module         varchar(20) NOT NULL
                   CHECK (module IN (
                     'dashboard', 'doctors', 'patients', 'appointments',
                     'schedule', 'settings', 'ai', 'whatsapp', 'reports'
                   )),

  can_view       boolean NOT NULL DEFAULT false,
  can_create     boolean NOT NULL DEFAULT false,
  can_update     boolean NOT NULL DEFAULT false,
  can_delete     boolean NOT NULL DEFAULT false,

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT permissions_role_module_unique UNIQUE (role_id, module)
);

-- Roles & Permissions loads "every module's permissions for this role" as one query.
CREATE INDEX IF NOT EXISTS idx_permissions_role_id ON clinic.permissions (role_id);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_permissions_set_updated_at ON clinic.permissions;
CREATE TRIGGER trg_permissions_set_updated_at
  BEFORE UPDATE ON clinic.permissions
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
