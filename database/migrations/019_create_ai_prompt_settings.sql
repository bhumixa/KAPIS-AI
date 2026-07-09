-- ==============================================================================
-- Kapis AI Platform - Sprint 7: AI prompt settings table
-- Apply manually (never auto-run):
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/019_create_ai_prompt_settings.sql
--
-- Single-row configuration for the future AI receptionist's persona
-- (personality, tone, greeting, escalation rules, system prompt, ...).
-- Distinct from `clinic.clinics.ai_settings` (008), which holds the AI
-- *provider* config (API keys, model, temperature) - this table holds how
-- the AI should *behave*, not which model runs it. `id smallint CHECK (id
-- = 1)` is the standard Postgres singleton-table trick: it structurally
-- forbids a second row instead of relying on application code to enforce
-- it. Store only - nothing here is read by an AI provider yet.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.ai_prompt_settings (
  id                       smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  clinic_personality       text NOT NULL DEFAULT '',
  tone                     varchar(100) NOT NULL DEFAULT '',
  greeting                 text NOT NULL DEFAULT '',
  fallback_message         text NOT NULL DEFAULT '',
  emergency_instructions   text NOT NULL DEFAULT '',
  escalation_rules         text NOT NULL DEFAULT '',
  system_prompt            text NOT NULL DEFAULT '',
  enabled                  boolean NOT NULL DEFAULT false,

  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_ai_prompt_settings_set_updated_at ON clinic.ai_prompt_settings;
CREATE TRIGGER trg_ai_prompt_settings_set_updated_at
  BEFORE UPDATE ON clinic.ai_prompt_settings
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
