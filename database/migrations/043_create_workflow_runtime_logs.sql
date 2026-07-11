-- ==============================================================================
-- Kapis AI Platform - Sprint 21: Workflow runtime logs table
-- Apply manually, after 042_create_workflow_runtime.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/043_create_workflow_runtime_logs.sql
--
-- Append-only step-by-step trace for a clinic.workflow_runtime_executions
-- row - one row per pipeline stage the Sprint 21 flow diagram names
-- (RECEIVED, CONTEXT_BUILT, AI_EXECUTED, N8N_TRIGGERED, DECISION_MADE,
-- REPLY_SENT, HISTORY_PERSISTED) plus RETRY/FAILED for WorkflowRetryService's
-- capped-retry attempts. Lets the Automation Dashboard show exactly where a
-- run is or where it failed, without re-deriving that from
-- clinic.ai_execution_history/clinic.workflow_executions timestamps. No
-- updated_at/trigger, same reasoning clinic.messages/clinic.whatsapp_events
-- use: a log row is never edited after it's written. `metadata` is jsonb for
-- the same "flexible payload, one column per row shape, not per field" reason
-- clinic.whatsapp_messages.payload/clinic.workflow_executions.request_payload
-- use it.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.workflow_runtime_logs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  workflow_runtime_id   uuid NOT NULL REFERENCES clinic.workflow_runtime_executions (id) ON DELETE CASCADE,

  step                  varchar(30) NOT NULL
                          CHECK (step IN (
                            'RECEIVED', 'CONTEXT_BUILT', 'AI_EXECUTED', 'N8N_TRIGGERED',
                            'DECISION_MADE', 'REPLY_SENT', 'HISTORY_PERSISTED', 'RETRY', 'FAILED'
                          )),
  status                varchar(15) NOT NULL CHECK (status IN ('started', 'success', 'failed')),
  message               text NOT NULL DEFAULT '',
  metadata              jsonb NOT NULL DEFAULT '{}',

  created_at            timestamptz NOT NULL DEFAULT now()
);

-- A run's detail view (GET /api/workflow-runtime/executions/:id/logs) reads
-- every log for one run, oldest first.
CREATE INDEX IF NOT EXISTS idx_workflow_runtime_logs_workflow_runtime_id_created_at
  ON clinic.workflow_runtime_logs (workflow_runtime_id, created_at ASC);
