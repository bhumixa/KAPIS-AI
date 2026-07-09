-- ==============================================================================
-- Kapis AI Platform - Sprint 6: User-Roles join table
-- Apply manually (never auto-run), after 009_create_users.sql and
-- 010_create_roles.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/012_create_user_roles.sql
--
-- Many-to-many between users and roles - future-ready beyond today's mock UI,
-- which only ever assigns one role per user via `ClinicUser.role`. A plain
-- join table (composite primary key, no surrogate id) since the relationship
-- itself carries no extra data yet.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.user_roles (
  user_id        uuid NOT NULL REFERENCES clinic.users (id) ON DELETE CASCADE,
  role_id        uuid NOT NULL REFERENCES clinic.roles (id) ON DELETE CASCADE,

  created_at     timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, role_id)
);

-- "Which users have this role" - Roles & Permissions / user list filtering by role.
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON clinic.user_roles (role_id);
