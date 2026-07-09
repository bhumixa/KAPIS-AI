-- ==============================================================================
-- Kapis AI Platform - Sprint 9: Conversations table
-- Apply manually (never auto-run), after 006_create_patients.sql and
-- 009_create_users.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/022_create_conversations.sql
--
-- One row per WhatsApp thread with a patient - mirrors `Conversation`
-- field-for-field. `channel` is a CHECK-constrained varchar (not a bare
-- text column) even though only 'whatsapp' exists today, the same
-- forward-looking choice `whatsapp_integration`/`claude_integration`
-- (020_create_integrations.sql) made for `status`. `assigned_to_user_id`
-- is nullable and ON DELETE SET NULL (not CASCADE) so deleting a staff
-- account un-assigns their conversations instead of deleting conversation
-- history - it is a denormalized "who owns this today" pointer kept in
-- sync by the application layer, mirroring `ConversationService.setAssignedUser()`;
-- the authoritative append-only record of who was assigned when lives in
-- `conversation_assignments` (025_create_conversation_assignments.sql).
-- `tags` is `text[]`, the same free-form-list choice
-- `018_create_message_templates.sql` made for `variables`.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.conversations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  patient_id            uuid NOT NULL REFERENCES clinic.patients (id) ON DELETE CASCADE,
  channel               varchar(20) NOT NULL DEFAULT 'whatsapp'
                          CHECK (channel IN ('whatsapp')),
  status                varchar(15) NOT NULL DEFAULT 'open'
                          CHECK (status IN ('open', 'waiting', 'ai_pending', 'closed')),
  assigned_to_user_id   uuid REFERENCES clinic.users (id) ON DELETE SET NULL,
  tags                  text[] NOT NULL DEFAULT '{}',

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Inbox filters/joins by patient and by status - both used on every load of the Inbox page.
CREATE INDEX IF NOT EXISTS idx_conversations_patient_id ON clinic.conversations (patient_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON clinic.conversations (status);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_conversations_set_updated_at ON clinic.conversations;
CREATE TRIGGER trg_conversations_set_updated_at
  BEFORE UPDATE ON clinic.conversations
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
