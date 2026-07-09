-- ==============================================================================
-- Kapis AI Platform - Sprint 6: Clinics table
-- Apply manually (never auto-run):
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/008_create_clinics.sql
--
-- Central clinic configuration - the table every future AI, WhatsApp, Google
-- Calendar, and Notification module reads from. Holds the clinic's own
-- identity (name, address, timezone, ...) as real columns, mirroring
-- `ClinicProfile` field-for-field.
--
-- `business_hours`, `appointment_settings`, `ai_settings`,
-- `whatsapp_settings`, and `notification_settings` are `jsonb`, not their own
-- normalized tables - a deliberate exception to the "one row per (entity,
-- category)" preference `doctor_schedules` set in Sprint 3. That preference
-- was about a genuinely relational need ("which doctors work Mondays" as a
-- plain indexed query); there is no equivalent cross-clinic query need here
-- in a single-clinic-per-deployment app today, and the AI/WhatsApp/
-- Notification settings shapes will keep changing as those modules get
-- built, which a rigid table would fight on every sprint. Sprint 6 also only
-- asked for five named migrations (008-012); normalizing business hours into
-- its own table was not one of them. If a genuine relational need for
-- business hours or any settings group appears later (multi-clinic
-- reporting, etc.), it can be split out into its own migration then, the
-- same way doctor_schedules already shows how to do it.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.clinics (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  clinic_name            varchar(200) NOT NULL,
  logo_url               text NOT NULL DEFAULT '',
  registration_number    varchar(100) NOT NULL,
  tax_id                 varchar(100) NOT NULL DEFAULT '',

  address                text NOT NULL,
  city                   varchar(100) NOT NULL,
  state                  varchar(100) NOT NULL,
  country                varchar(100) NOT NULL,
  postal_code            varchar(20) NOT NULL,

  phone                  varchar(20) NOT NULL,
  email                  varchar(255) NOT NULL,
  website                text NOT NULL DEFAULT '',

  time_zone              varchar(50) NOT NULL DEFAULT 'UTC',
  currency               varchar(10) NOT NULL DEFAULT 'USD',
  language               varchar(50) NOT NULL DEFAULT 'English',

  -- One BusinessDayHours-shaped object per day: { day, isOpen, openTime,
  -- closeTime, lunchBreakStart, lunchBreakEnd }. See the header comment above.
  business_hours          jsonb NOT NULL DEFAULT '[]',
  appointment_settings    jsonb NOT NULL DEFAULT '{}',
  ai_settings             jsonb NOT NULL DEFAULT '{}',
  whatsapp_settings       jsonb NOT NULL DEFAULT '{}',
  notification_settings   jsonb NOT NULL DEFAULT '{}',

  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT clinics_registration_number_unique UNIQUE (registration_number),
  CONSTRAINT clinics_email_unique UNIQUE (email)
);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_clinics_set_updated_at ON clinic.clinics;
CREATE TRIGGER trg_clinics_set_updated_at
  BEFORE UPDATE ON clinic.clinics
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
