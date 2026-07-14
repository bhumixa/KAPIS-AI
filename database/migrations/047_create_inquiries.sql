-- ==============================================================================
-- Kapis AI Platform - Sprint 25: Anonymous Inquiry / Lead flow + AI intent
-- classification state
-- Apply manually, after 006_create_patients.sql, 022_create_conversations.sql,
-- and 042_create_workflow_runtime.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/047_create_inquiries.sql
--
-- Closes the WhatsApp pipeline's dead end for first-time senders: previously
-- WebhookService just stored an unlinked message and stopped (no Conversation,
-- no AI, no reply) when the sender's number didn't match any clinic.patients
-- row. clinic.inquiries is a lightweight "lead" record that lets a
-- Conversation exist without a Patient yet - the AI intent-classification
-- pipeline runs identically for both, and a real Patient is only created once
-- an inquiry actually converts into a booking (see clinic.patients.profile_source
-- below).
--
-- Also adds the columns needed for the AI to return more than a single reply
-- string: an intent classification (GENERAL_INQUIRY/BOOK_APPOINTMENT/
-- RESCHEDULE_APPOINTMENT/CANCEL_APPOINTMENT/EMERGENCY/HANDOFF), and
-- per-conversation "memory" of fields already collected across turns, so a
-- multi-turn booking doesn't repeat questions the sender already answered.
-- The mutable clinic.conversations row is the single source of truth for
-- that memory (survives restarts/refreshes); clinic.workflow_runtime_executions
-- only gets an audit-only copy of the intent for dashboard/debugging - it is
-- never read back into the next prompt.
-- ==============================================================================

-- ---- A. clinic.inquiries ----

CREATE TABLE IF NOT EXISTS clinic.inquiries (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  whatsapp_number        varchar(20) NOT NULL,
  display_name           varchar(200) NOT NULL DEFAULT '',

  status                 varchar(20) NOT NULL DEFAULT 'open'
                           CHECK (status IN ('open', 'converted', 'closed')),
  converted_patient_id   uuid REFERENCES clinic.patients (id) ON DELETE SET NULL,
  converted_at           timestamptz,

  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_whatsapp_number ON clinic.inquiries (whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON clinic.inquiries (status);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_inquiries_set_updated_at ON clinic.inquiries;
CREATE TRIGGER trg_inquiries_set_updated_at
  BEFORE UPDATE ON clinic.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();

-- ---- B. clinic.conversations: patient becomes optional, inquiry + AI memory added ----

ALTER TABLE clinic.conversations ALTER COLUMN patient_id DROP NOT NULL;

ALTER TABLE clinic.conversations
  ADD COLUMN IF NOT EXISTS inquiry_id uuid REFERENCES clinic.inquiries (id) ON DELETE SET NULL;

ALTER TABLE clinic.conversations
  ADD CONSTRAINT chk_conversations_has_owner
    CHECK (patient_id IS NOT NULL OR inquiry_id IS NOT NULL);

-- Latest AI classification for this conversation - read back into the prompt
-- every turn (PromptBuilderService) so the AI doesn't repeat questions.
ALTER TABLE clinic.conversations
  ADD COLUMN IF NOT EXISTS last_intent varchar(30)
    CHECK (last_intent IN (
      'GENERAL_INQUIRY', 'BOOK_APPOINTMENT', 'RESCHEDULE_APPOINTMENT',
      'CANCEL_APPOINTMENT', 'EMERGENCY', 'HANDOFF'
    ));
ALTER TABLE clinic.conversations
  ADD COLUMN IF NOT EXISTS last_intent_confidence numeric(4,3);
ALTER TABLE clinic.conversations
  ADD COLUMN IF NOT EXISTS pending_action varchar(30)
    CHECK (pending_action IN ('COLLECTING_FIELDS', 'AWAITING_CONFIRMATION'));
ALTER TABLE clinic.conversations
  ADD COLUMN IF NOT EXISTS collected_fields jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_conversations_inquiry_id ON clinic.conversations (inquiry_id);

-- ---- C. clinic.workflow_runtime_executions: decision enum grows, audit-only intent columns ----

ALTER TABLE clinic.workflow_runtime_executions
  DROP CONSTRAINT IF EXISTS workflow_runtime_executions_decision_check;
ALTER TABLE clinic.workflow_runtime_executions
  ADD CONSTRAINT workflow_runtime_executions_decision_check
    CHECK (decision IN (
      'AUTO_REPLY', 'BOOK_APPOINTMENT', 'RESCHEDULE_APPOINTMENT',
      'CANCEL_APPOINTMENT', 'EMERGENCY', 'HANDOFF', 'CREATE_TASK', 'NO_ACTION'
    ));

ALTER TABLE clinic.workflow_runtime_executions
  ADD COLUMN IF NOT EXISTS intent varchar(30);
ALTER TABLE clinic.workflow_runtime_executions
  ADD COLUMN IF NOT EXISTS intent_confidence numeric(4,3);

-- ---- D. clinic.patients: flags profiles auto-created from a WhatsApp booking ----

ALTER TABLE clinic.patients
  ADD COLUMN IF NOT EXISTS profile_source varchar(20) NOT NULL DEFAULT 'manual'
    CHECK (profile_source IN ('manual', 'whatsapp_inquiry'));
