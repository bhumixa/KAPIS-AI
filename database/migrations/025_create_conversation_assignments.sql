-- ==============================================================================
-- Kapis AI Platform - Sprint 9: Conversation assignments table
-- Apply manually (never auto-run), after 022_create_conversations.sql and
-- 009_create_users.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/025_create_conversation_assignments.sql
--
-- Append-only assignment history - mirrors `ConversationAssignment`
-- field-for-field. Deliberately separate from the mutable
-- `conversations.assigned_to_user_id` pointer (022_create_conversations.sql):
-- "who is assigned right now" and "who has ever been assigned, and when"
-- are different questions, and only the second needs every row kept
-- forever. No `updated_at`/trigger, same reasoning as `messages` - an
-- assignment record is never edited after creation, only superseded by a
-- new one. `assigned_to_user_id` is ON DELETE CASCADE (unlike the nullable,
-- ON DELETE SET NULL pointer on `conversations`) because a history row
-- naming a since-deleted user is no longer meaningful to keep.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.conversation_assignments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  conversation_id       uuid NOT NULL REFERENCES clinic.conversations (id) ON DELETE CASCADE,
  assigned_to_user_id   uuid NOT NULL REFERENCES clinic.users (id) ON DELETE CASCADE,
  assigned_to_role      varchar(20) NOT NULL CHECK (assigned_to_role IN ('receptionist', 'doctor')),
  assigned_by_name      varchar(200) NOT NULL,

  assigned_at           timestamptz NOT NULL DEFAULT now()
);

-- Assignment history is always looked up per conversation, newest first.
CREATE INDEX IF NOT EXISTS idx_conversation_assignments_conversation_id
  ON clinic.conversation_assignments (conversation_id);
