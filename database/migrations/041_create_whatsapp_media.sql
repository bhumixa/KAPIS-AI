-- ==============================================================================
-- Kapis AI Platform - Sprint 20: WhatsApp media metadata table
-- Apply manually (never auto-run):
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/041_create_whatsapp_media.sql
--
-- Metadata only, for both directions - Sprint 20 is the communication layer,
-- not media storage: an incoming image/document webhook already carries
-- Meta's media id, mime type, sha256, and caption/filename directly on the
-- message payload (Meta requires a *separate*, authenticated GET .../{media-id}
-- call to resolve a short-lived CDN URL, and another to fetch the bytes -
-- this sprint never makes either call, so no binary is ever downloaded or
-- stored). An outgoing image/document is likewise sent by `link` (a URL Meta
-- itself fetches), never an uploaded file - MediaMessageDto's `link` is what's
-- persisted here, not file content. `whatsapp_message_id` is NOT NULL/CASCADE,
-- unlike `whatsapp_messages.conversation_id`/`message_id` - a media row never
-- makes sense without the message row it describes.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.whatsapp_media (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  whatsapp_message_id   uuid NOT NULL REFERENCES clinic.whatsapp_messages (id) ON DELETE CASCADE,

  media_id              varchar(100) NOT NULL DEFAULT '',
  media_type             varchar(20) NOT NULL CHECK (media_type IN ('image', 'document')),
  mime_type              varchar(100) NOT NULL DEFAULT '',
  sha256                 varchar(100) NOT NULL DEFAULT '',
  file_size              integer,
  link                   text NOT NULL DEFAULT '',
  caption                text NOT NULL DEFAULT '',
  filename               text NOT NULL DEFAULT '',

  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_media_whatsapp_message_id
  ON clinic.whatsapp_media (whatsapp_message_id);
