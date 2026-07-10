-- ==============================================================================
-- Kapis AI Platform - Sprint 15: Workflow Executions table
-- Apply manually (never auto-run):
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/033_create_workflow_executions.sql
--
-- NOTE ON NUMBERING: the previous migration is 025_create_conversation_assignments.sql
-- (Sprint 9). This file is named 033_create_workflow_executions.sql per the Sprint 15
-- brief's explicit instruction, leaving 026-032 unused - it does not follow this
-- project's normal "next sequential number" convention (see database/migrations/README.md).
-- Flagging here so a future migration author doesn't assume 026-032 exist somewhere else.
--
-- Append-only execution log for the n8n bridge (apps/api-server/src/n8n/). One row
-- per POST /api/n8n/workflows/:id/trigger call, whether the webhook call to n8n
-- succeeded or failed. Mirrors `WorkflowExecution` field-for-field. No `updated_at`/
-- trigger, same reasoning `023_create_messages.sql` uses: a row is never edited after
-- it's written. `workflow_id` is not a FK - workflow definitions are loaded from
-- services/n8n-workflows/ JSON files at process start (WorkflowRegistryService), not
-- stored in Postgres, so there is no `clinic.workflows` table to reference.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.workflow_executions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  workflow_id       varchar(100) NOT NULL,
  workflow_name     varchar(200) NOT NULL,
  status            varchar(20) NOT NULL CHECK (status IN ('success', 'failed')),

  started_at        timestamptz NOT NULL,
  finished_at       timestamptz,
  duration_ms       integer,

  request_payload   jsonb,
  response_payload  jsonb,
  error_message     text
);

-- Dashboard's "Recent Executions" / "last execution per workflow" queries filter/sort
-- by workflow_id + started_at, the same shape 023_create_messages.sql's index uses.
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id_started_at
  ON clinic.workflow_executions (workflow_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_status
  ON clinic.workflow_executions (status);
