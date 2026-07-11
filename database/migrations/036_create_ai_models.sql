-- ==============================================================================
-- Kapis AI Platform - Sprint 17: AI models catalog table
-- Apply manually (never auto-run):
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/036_create_ai_models.sql
--
-- Catalog of AI models the orchestration pipeline can be pointed at - the
-- backend that every future AI provider (Claude, OpenAI, Gemini, ...) will
-- register a row into, per the Sprint 17 brief's architecture diagram. This
-- sprint seeds exactly one row (provider = 'mock', see
-- database/seed/003_ai_orchestration_seed.sql) which AIExecutionService reads
-- to fill its deterministic mock response's `model`/`provider` fields - no row
-- here is ever called over the network yet. `config` (e.g. temperature,
-- max tokens, API base URL) is JSONB rather than typed columns for the same
-- reason `020_create_integrations.sql` used JSONB-free typed tables per
-- integration was rejected there: each provider's config shape genuinely
-- differs, and this table's whole purpose is holding many providers
-- generically. The partial unique index enforces "at most one default model"
-- the same way `019_create_ai_prompt_settings.sql`'s `id smallint CHECK
-- (id = 1)` enforces "exactly one settings row" - a structural guarantee
-- instead of an application-level check.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.ai_models (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  provider      varchar(50) NOT NULL,
  model_name    varchar(100) NOT NULL,
  display_name  varchar(150) NOT NULL,
  model_type    varchar(20) NOT NULL DEFAULT 'chat' CHECK (model_type IN ('chat', 'completion')),
  is_active     boolean NOT NULL DEFAULT true,
  is_default    boolean NOT NULL DEFAULT false,
  config        jsonb NOT NULL DEFAULT '{}',

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ai_models_provider_model_name_unique UNIQUE (provider, model_name)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_models_single_default
  ON clinic.ai_models (is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_ai_models_is_active ON clinic.ai_models (is_active);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_ai_models_set_updated_at ON clinic.ai_models;
CREATE TRIGGER trg_ai_models_set_updated_at
  BEFORE UPDATE ON clinic.ai_models
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
