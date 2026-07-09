-- ==============================================================================
-- Kapis AI Platform - Sprint 9: Conversation notes table
-- Apply manually (never auto-run), after 022_create_conversations.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/024_create_conversation_notes.sql
--
-- Internal (staff-only, never sent to the patient) notes on a conversation -
-- mirrors `ConversationNote` field-for-field. Kept as its own table rather
-- than folded into `conversations` (e.g. a single `internal_notes` text
-- column) because notes are a one-to-many, independently timestamped,
-- independently editable/deletable list - the same reasoning
-- `doctor_leaves`/`clinic_holidays` (003/005) apply for doctor-specific
-- one-to-many records instead of array columns on `doctors`.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.conversation_notes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  conversation_id   uuid NOT NULL REFERENCES clinic.conversations (id) ON DELETE CASCADE,
  author_name       varchar(200) NOT NULL,
  body              text NOT NULL,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Internal Notes panel loads every note for one conversation, newest first.
CREATE INDEX IF NOT EXISTS idx_conversation_notes_conversation_id
  ON clinic.conversation_notes (conversation_id);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_conversation_notes_set_updated_at ON clinic.conversation_notes;
CREATE TRIGGER trg_conversation_notes_set_updated_at
  BEFORE UPDATE ON clinic.conversation_notes
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
