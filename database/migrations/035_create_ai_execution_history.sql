-- ==============================================================================
-- Kapis AI Platform - Sprint 17: AI execution history table
-- Apply manually, after 022_create_conversations.sql and 034_create_prompt_templates.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/035_create_ai_execution_history.sql
--
-- Append-only execution log for AIExecutionService (apps/api-server/src/ai/) -
-- one row per POST /api/ai/generate call. Mirrors `WorkflowExecution`
-- (033_create_workflow_executions.sql)'s "log every run" shape, but for the AI
-- pipeline instead of the n8n bridge. No `updated_at`/trigger, same reasoning
-- `023_create_messages.sql` uses: a row is never edited after it's written.
-- `prompt_template_id` is nullable + `ON DELETE SET NULL` since a template may
-- later be deleted without invalidating history of a prompt already run.
-- This sprint's AIExecutionService is mock-only (no Claude/OpenAI/Gemini call),
-- so `provider` is always 'mock' today, but the column exists now so a future
-- real provider integration is additive, not a schema change.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.ai_execution_history (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  conversation_id     uuid NOT NULL REFERENCES clinic.conversations (id) ON DELETE CASCADE,
  prompt_template_id  uuid REFERENCES clinic.prompt_templates (id) ON DELETE SET NULL,

  system_prompt       text NOT NULL,
  user_prompt         text NOT NULL,
  response            text NOT NULL DEFAULT '',

  model               varchar(100) NOT NULL,
  provider            varchar(50) NOT NULL,

  prompt_tokens       integer NOT NULL DEFAULT 0,
  completion_tokens   integer NOT NULL DEFAULT 0,
  total_tokens        integer NOT NULL DEFAULT 0,
  latency_ms          integer NOT NULL DEFAULT 0,
  finish_reason       varchar(30) NOT NULL DEFAULT '',

  status              varchar(20) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  error_message       text,

  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Dashboard's "AI Executions Today" / "Average Latency" and the per-conversation
-- history list both filter/sort by conversation_id + created_at, the same shape
-- 033's index uses for workflow_id + started_at.
CREATE INDEX IF NOT EXISTS idx_ai_execution_history_conversation_id_created_at
  ON clinic.ai_execution_history (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_execution_history_created_at
  ON clinic.ai_execution_history (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_execution_history_status
  ON clinic.ai_execution_history (status);
