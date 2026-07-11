-- ==============================================================================
-- Kapis AI Platform - Sprint 20: WhatsApp webhook events table
-- Apply manually (never auto-run):
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/040_create_whatsapp_events.sql
--
-- Append-only raw log of every POST /api/whatsapp/webhook call Meta makes -
-- "Store everything" per the Sprint 20 brief, independent of whether
-- WebhookService could map the event onto a `whatsapp_messages`/`messages`
-- row. `payload` is the verbatim JSON body Meta sent, so a parsing bug or a
-- future Meta field this sprint doesn't model yet is never silently lost.
-- No `updated_at`/trigger - an event is a fact about a point in time, never
-- edited after it's written, same reasoning `023_create_messages.sql` and
-- `033_create_workflow_executions.sql` give for their own append-only tables.
--
-- `event_type = 'typing'` is intentionally forward-compatible rather than
-- exercised by real traffic today: the Cloud API's public webhook payload
-- has no "user is typing" field as of this sprint (only businesses can send
-- a typing indicator, via the outbound read-receipt call - there is nothing
-- for a business to *receive*). WebhookService still checks for one
-- defensively and logs it under this event_type if Meta ever adds it,
-- instead of silently dropping an unrecognized payload shape.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.whatsapp_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  event_type      varchar(20) NOT NULL
                    CHECK (event_type IN ('message', 'status', 'typing', 'unknown')),
  wa_message_id   varchar(100) NOT NULL DEFAULT '',
  status          varchar(15) NOT NULL DEFAULT '',
  payload         jsonb NOT NULL DEFAULT '{}',

  received_at     timestamptz NOT NULL DEFAULT now()
);

-- WhatsappHealthDto's `lastWebhook` reads the single most recent row.
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_received_at
  ON clinic.whatsapp_events (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_events_wa_message_id
  ON clinic.whatsapp_events (wa_message_id);
