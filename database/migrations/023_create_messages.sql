-- ==============================================================================
-- Kapis AI Platform - Sprint 9: Messages table
-- Apply manually (never auto-run), after 022_create_conversations.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/023_create_messages.sql
--
-- One row per inbound/outbound WhatsApp message - mirrors `Message`
-- field-for-field. Unlike every other Sprint 9 table, there is no
-- `updated_at`/trigger here: a message is append-only in the mock model
-- (`MessageService` never mutates `body`), the one exception being the
-- `read` flag `markConversationRead()` flips - `sent_at` alone is enough
-- history for that, so a full audit trigger would be unused ceremony.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  conversation_id   uuid NOT NULL REFERENCES clinic.conversations (id) ON DELETE CASCADE,
  direction         varchar(10) NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  sender            varchar(10) NOT NULL CHECK (sender IN ('patient', 'staff', 'ai')),
  sender_name       varchar(200) NOT NULL,
  body              text NOT NULL,
  read              boolean NOT NULL DEFAULT false,

  sent_at           timestamptz NOT NULL DEFAULT now()
);

-- Conversation History timeline and unread-count queries both filter/sort by conversation_id + sent_at.
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_sent_at
  ON clinic.messages (conversation_id, sent_at);
