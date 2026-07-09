-- ==============================================================================
-- Kapis AI Platform - Sprint 8: Integrations tables
-- Apply manually (never auto-run):
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/020_create_integrations.sql
--
-- Three single-row configuration tables, one per external integration
-- (WhatsApp Cloud API, Claude API, Google Calendar), mirroring
-- `IntegrationService`'s three Angular models field-for-field. Each uses the
-- `id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1)` singleton-table trick
-- `019_create_ai_prompt_settings.sql` (Sprint 7) established, rather than
-- one generic `clinic.integrations` table with a `type` discriminator and
-- nullable columns for every field of every type - each integration's
-- fields are genuinely different (WhatsApp has a WABA ID, Claude has a
-- temperature, Google Calendar has OAuth client credentials), so real typed
-- columns per table stay queryable and NOT-NULL-enforceable in a way a
-- shared nullable-everything table would not. `status` is never written
-- directly by a form - only a (future, real) Test Connection call updates
-- it; today it is set by mock application code, matching
-- `IntegrationService.test*Connection()`. No API keys/tokens/secrets have a
-- default beyond empty string - Sprint 8 stores configuration only, no
-- external call ever reads these columns.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.whatsapp_integration (
  id                 smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  business_number    varchar(20) NOT NULL DEFAULT '',
  phone_number_id    varchar(50) NOT NULL DEFAULT '',
  waba_id            varchar(50) NOT NULL DEFAULT '',
  access_token       text NOT NULL DEFAULT '',
  verify_token       text NOT NULL DEFAULT '',
  webhook_url        text NOT NULL DEFAULT '',

  status             varchar(15) NOT NULL DEFAULT 'disconnected'
                       CHECK (status IN ('connected', 'disconnected', 'error')),

  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinic.claude_integration (
  id                 smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  api_key            text NOT NULL DEFAULT '',
  model              varchar(100) NOT NULL DEFAULT 'claude-sonnet-5',
  max_tokens         integer NOT NULL DEFAULT 1024 CHECK (max_tokens > 0),
  temperature        numeric(2, 1) NOT NULL DEFAULT 0.4
                       CHECK (temperature >= 0 AND temperature <= 1),
  enabled            boolean NOT NULL DEFAULT false,

  status             varchar(15) NOT NULL DEFAULT 'disconnected'
                       CHECK (status IN ('connected', 'disconnected', 'error')),

  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinic.google_calendar_integration (
  id                 smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  client_id          text NOT NULL DEFAULT '',
  client_secret      text NOT NULL DEFAULT '',
  redirect_url       text NOT NULL DEFAULT '',
  calendar_id        varchar(255) NOT NULL DEFAULT '',
  enabled            boolean NOT NULL DEFAULT false,

  status             varchar(15) NOT NULL DEFAULT 'disconnected'
                       CHECK (status IN ('connected', 'disconnected', 'error')),

  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_whatsapp_integration_set_updated_at ON clinic.whatsapp_integration;
CREATE TRIGGER trg_whatsapp_integration_set_updated_at
  BEFORE UPDATE ON clinic.whatsapp_integration
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();

DROP TRIGGER IF EXISTS trg_claude_integration_set_updated_at ON clinic.claude_integration;
CREATE TRIGGER trg_claude_integration_set_updated_at
  BEFORE UPDATE ON clinic.claude_integration
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();

DROP TRIGGER IF EXISTS trg_google_calendar_integration_set_updated_at ON clinic.google_calendar_integration;
CREATE TRIGGER trg_google_calendar_integration_set_updated_at
  BEFORE UPDATE ON clinic.google_calendar_integration
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
