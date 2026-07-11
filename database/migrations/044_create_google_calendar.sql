-- ==============================================================================
-- Kapis AI Platform - Sprint 22: Google Calendar OAuth connection table
-- Apply manually:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/044_create_google_calendar.sql
--
-- Stores the OAuth 2.0 connection GoogleCalendarService establishes with a
-- Google account: access token, refresh token, token expiry, and the target
-- calendar id, plus a connected/disconnected/error status and the last
-- successful sync timestamp for the health/dashboard tiles.
--
-- This schema has no clinic_id anywhere (see clinic.appointments) - the
-- whole platform is single-clinic today - so this table is a "singleton
-- settings row" the same way a future multi-clinic build would widen with a
-- clinic_id column later: GoogleCalendarRepository always reads/writes the
-- single most recent row rather than looking one up by a tenant key. Tokens
-- are mutated in place as the connection is established/refreshed/revoked,
-- so - unlike the append-only history tables in this schema - it gets an
-- updated_at + trigger, same shape clinic.workflow_runtime_executions uses.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.google_calendar_connections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  access_token      text NOT NULL DEFAULT '',
  refresh_token     text NOT NULL DEFAULT '',
  token_expiry      timestamptz,
  calendar_id       varchar(255) NOT NULL DEFAULT 'primary',
  connected_email   varchar(255) NOT NULL DEFAULT '',
  status            varchar(15) NOT NULL DEFAULT 'disconnected'
                      CHECK (status IN ('connected', 'disconnected', 'error')),
  last_sync_at      timestamptz,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- GoogleCalendarRepository.findLatest() reads the single most recent
-- connection row - see this file's header comment on why there's no
-- clinic_id to key on instead.
CREATE INDEX IF NOT EXISTS idx_google_calendar_connections_created_at
  ON clinic.google_calendar_connections (created_at DESC);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql - token/
-- status/last_sync_at columns are all mutated in place, same reasoning
-- 042_create_workflow_runtime.sql's trigger uses.
DROP TRIGGER IF EXISTS trg_google_calendar_connections_set_updated_at ON clinic.google_calendar_connections;
CREATE TRIGGER trg_google_calendar_connections_set_updated_at
  BEFORE UPDATE ON clinic.google_calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
