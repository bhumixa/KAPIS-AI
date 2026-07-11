-- ==============================================================================
-- Kapis AI Platform - Sprint 21: Workflow runtime executions table
-- Apply manually, after 022_create_conversations.sql, 023_create_messages.sql,
-- 035_create_ai_execution_history.sql, 033_create_workflow_executions.sql, and
-- 039_create_whatsapp_messages.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/042_create_workflow_runtime.sql
--
-- One row per end-to-end automated pipeline run: Incoming WhatsApp ->
-- Conversation Engine -> RAG Context Builder -> AI Orchestrator -> AI
-- Provider -> n8n Workflow -> Decision -> Send WhatsApp Reply -> Persist
-- History. This table is the "glue" record that links a
-- clinic.conversations/messages/whatsapp_messages row to the
-- clinic.ai_execution_history row (Sprint 17) and clinic.workflow_executions
-- row (Sprint 15) it produced, so the Automation Dashboard can show one
-- timeline per run instead of four disconnected tables. All four FKs are
-- nullable + ON DELETE SET NULL: a run is still worth keeping for the
-- dashboard/debugging even if the conversation or a downstream row it
-- produced is later deleted. Unlike the append-only history tables above,
-- this one is mutated in place as a run progresses (RUNNING -> RETRYING ->
-- COMPLETED/FAILED), so - unlike clinic.ai_execution_history/
-- clinic.messages - it does get an updated_at + trigger, same shape
-- clinic.conversations itself uses. `decision`/`status` are varchar CHECK
-- constraints, not Postgres enum types, matching every other status/type
-- column in this schema (see e.g. clinic.conversations.status).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.workflow_runtime_executions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  conversation_id       uuid REFERENCES clinic.conversations (id) ON DELETE SET NULL,
  message_id            uuid REFERENCES clinic.messages (id) ON DELETE SET NULL,
  whatsapp_message_id   uuid REFERENCES clinic.whatsapp_messages (id) ON DELETE SET NULL,
  ai_execution_id       uuid REFERENCES clinic.ai_execution_history (id) ON DELETE SET NULL,
  n8n_execution_id      uuid REFERENCES clinic.workflow_executions (id) ON DELETE SET NULL,

  trigger_source        varchar(30) NOT NULL DEFAULT 'whatsapp_webhook',
  decision              varchar(20)
                          CHECK (decision IN ('AUTO_REPLY', 'CREATE_TASK', 'HANDOFF', 'NO_ACTION')),
  status                varchar(15) NOT NULL DEFAULT 'RUNNING'
                          CHECK (status IN ('RUNNING', 'RETRYING', 'COMPLETED', 'FAILED')),
  retry_count            integer NOT NULL DEFAULT 0,

  ai_latency_ms          integer,
  workflow_latency_ms    integer,
  duration_ms            integer,
  error_message          text,

  started_at             timestamptz NOT NULL DEFAULT now(),
  completed_at           timestamptz,

  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- Automation Dashboard's "Recent Executions" list and per-conversation
-- lookups both filter/sort by conversation_id + started_at, same shape
-- 035's index uses for clinic.ai_execution_history.
CREATE INDEX IF NOT EXISTS idx_workflow_runtime_executions_conversation_id_started_at
  ON clinic.workflow_runtime_executions (conversation_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_runtime_executions_started_at
  ON clinic.workflow_runtime_executions (started_at DESC);

-- Dashboard's Running/Completed/Failed/Success Rate tiles group by status.
CREATE INDEX IF NOT EXISTS idx_workflow_runtime_executions_status
  ON clinic.workflow_runtime_executions (status);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql - status/
-- decision/latency columns are all mutated in place as a run progresses.
DROP TRIGGER IF EXISTS trg_workflow_runtime_executions_set_updated_at ON clinic.workflow_runtime_executions;
CREATE TRIGGER trg_workflow_runtime_executions_set_updated_at
  BEFORE UPDATE ON clinic.workflow_runtime_executions
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
