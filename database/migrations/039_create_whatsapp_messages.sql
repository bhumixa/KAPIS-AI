-- ==============================================================================
-- Kapis AI Platform - Sprint 20: WhatsApp messages table
-- Apply manually (never auto-run):
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/039_create_whatsapp_messages.sql
--
-- One row per WhatsApp Cloud API message, in either direction - the WhatsApp-
-- specific record (Meta message id, delivery status, raw type-specific
-- payload) that sits alongside, not instead of, `clinic.messages`
-- (023_create_messages.sql, the Conversation Engine's channel-agnostic
-- timeline). `message_id` links the two rows when Sprint 20 could resolve a
-- conversation (WebhookService/WhatsappService both write both tables in the
-- same request); it stays nullable for the case a webhook event arrives for a
-- phone number no patient record has yet, where this row is still worth
-- keeping for support/debugging even though there's no conversation to
-- attach it to. `payload` holds whatever is type-specific (template name +
-- parameters, media link/caption/filename) rather than a column per type -
-- same reasoning `020_create_integrations.sql` gives for typed columns
-- *within* one integration, but applied the other way here since the
-- variation is between message types, not between unrelated integrations.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.whatsapp_messages (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  conversation_id    uuid REFERENCES clinic.conversations (id) ON DELETE SET NULL,
  message_id         uuid REFERENCES clinic.messages (id) ON DELETE SET NULL,

  wa_message_id      varchar(100) NOT NULL DEFAULT '',
  direction          varchar(10) NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  message_type       varchar(20) NOT NULL
                       CHECK (message_type IN ('text', 'template', 'image', 'document')),
  from_number        varchar(20) NOT NULL DEFAULT '',
  to_number          varchar(20) NOT NULL DEFAULT '',
  body               text NOT NULL DEFAULT '',
  payload            jsonb NOT NULL DEFAULT '{}',

  status             varchar(15) NOT NULL DEFAULT 'sent'
                       CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'received')),
  error_message      text,

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- WebhookService looks up the row a status callback refers to by Meta's own
-- message id - not declared UNIQUE (an empty '' default would collide across
-- every row created before Meta assigns one), so this is a plain index.
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_wa_message_id
  ON clinic.whatsapp_messages (wa_message_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id
  ON clinic.whatsapp_messages (conversation_id);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql - the
-- `status` column is mutated in place as delivery/read callbacks arrive.
DROP TRIGGER IF EXISTS trg_whatsapp_messages_set_updated_at ON clinic.whatsapp_messages;
CREATE TRIGGER trg_whatsapp_messages_set_updated_at
  BEFORE UPDATE ON clinic.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
