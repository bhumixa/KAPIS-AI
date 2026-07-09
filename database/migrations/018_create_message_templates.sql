-- ==============================================================================
-- Kapis AI Platform - Sprint 7: Message templates table
-- Apply manually (never auto-run):
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/018_create_message_templates.sql
--
-- Reusable WhatsApp/email templates. `variables` holds merge-field names
-- (e.g. 'patientName') the future WhatsApp/Notification modules substitute
-- at send time - stored as text[] rather than a child table since it is a
-- flat, order-independent list with no attributes of its own.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.message_templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name         varchar(200) NOT NULL,
  type         varchar(30) NOT NULL
                 CHECK (type IN (
                   'appointment_confirmation', 'reminder', 'follow_up',
                   'cancellation', 'welcome', 'thank_you'
                 )),
  subject      varchar(255) NOT NULL DEFAULT '',
  body         text NOT NULL,
  variables    text[] NOT NULL DEFAULT '{}',

  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_templates_type ON clinic.message_templates (type);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_message_templates_set_updated_at ON clinic.message_templates;
CREATE TRIGGER trg_message_templates_set_updated_at
  BEFORE UPDATE ON clinic.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
