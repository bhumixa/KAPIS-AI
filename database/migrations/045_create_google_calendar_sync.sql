-- ==============================================================================
-- Kapis AI Platform - Sprint 22: Google Calendar sync history table
-- Apply manually, after 044_create_google_calendar.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/045_create_google_calendar_sync.sql
--
-- Append-only trace of every attempt to create/update/delete a Google
-- Calendar event for a clinic.appointments row - one row per attempt, same
-- "append-only step log" shape clinic.workflow_runtime_logs uses. Also
-- doubles as the appointment_id <-> google_event_id link
-- GoogleCalendarSyncService needs when a later update/cancel comes in: the
-- most recent successful (status = 'SUCCESS') row for an appointment_id
-- carries the google_event_id to act on, so there's no separate mapping
-- table to keep in sync. No updated_at/trigger - a sync-history row is never
-- edited after it's written, same reasoning clinic.messages/
-- clinic.whatsapp_events/clinic.workflow_runtime_logs use. appointment_id has
-- no FK: a hard-deleted appointment (AppointmentsService.remove()) still
-- needs its DELETE-event sync row kept for the dashboard's history, so this
-- deliberately doesn't cascade or null out the way the nullable FKs in
-- 042_create_workflow_runtime.sql do. appointment_id is nullable for the
-- 'NOTIFY' operation: GoogleCalendarWebhookService persists one row per
-- Google push notification (see that service's own doc comment) before it's
-- known which appointment (if any) the changed event belongs to.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.google_calendar_sync_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  appointment_id    uuid,
  google_event_id   varchar(255),

  operation         varchar(10) NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE', 'NOTIFY')),
  status            varchar(10) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED')),
  error_message     text,
  metadata          jsonb NOT NULL DEFAULT '{}',

  synced_at         timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- GoogleCalendarSyncService looks up "the current google_event_id for this
-- appointment" (most recent successful row) on every update/cancel.
CREATE INDEX IF NOT EXISTS idx_google_calendar_sync_events_appointment_id_synced_at
  ON clinic.google_calendar_sync_events (appointment_id, synced_at DESC);

-- Sync History page (Angular) and the dashboard's "Events Synced Today" tile
-- both list/count recent rows regardless of appointment.
CREATE INDEX IF NOT EXISTS idx_google_calendar_sync_events_synced_at
  ON clinic.google_calendar_sync_events (synced_at DESC);
