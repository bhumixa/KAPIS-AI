-- ==============================================================================
-- Kapis AI Platform - Sprint 18: AI provider logs table
-- Apply manually, after 035_create_ai_execution_history.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/037_create_ai_provider_logs.sql
--
-- Append-only, provider-level audit log for the real AI provider integration
-- (apps/api-server/src/claude/) - one row per POST /api/ai/generate call,
-- written by AIHistoryService.record() immediately after its
-- clinic.ai_execution_history row, using that row's id as `execution_id`.
-- Distinct from `ai_execution_history`: this table carries provider-billing
-- metrics only (tokens, cost, latency, status) and never the prompt/response
-- text, so it stays cheap to query/export for usage reporting regardless of
-- how large the conversation content in ai_execution_history grows. `cost` is
-- a placeholder column - always NULL in this sprint; real per-model pricing
-- calculation is future work, but the column exists now so adding it later is
-- additive, not a schema change. No `updated_at`/trigger, same reasoning
-- `023_create_messages.sql` uses: a row is never edited after it's written.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.ai_provider_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  execution_id      uuid NOT NULL REFERENCES clinic.ai_execution_history (id) ON DELETE CASCADE,

  provider          varchar(50) NOT NULL,
  model             varchar(100) NOT NULL,

  request_tokens    integer NOT NULL DEFAULT 0,
  response_tokens   integer NOT NULL DEFAULT 0,
  cost              numeric(10, 6),

  latency_ms        integer NOT NULL DEFAULT 0,
  status            varchar(20) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  error_message     text,

  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_provider_logs_execution_id
  ON clinic.ai_provider_logs (execution_id);

CREATE INDEX IF NOT EXISTS idx_ai_provider_logs_created_at
  ON clinic.ai_provider_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_provider_logs_status
  ON clinic.ai_provider_logs (status);
