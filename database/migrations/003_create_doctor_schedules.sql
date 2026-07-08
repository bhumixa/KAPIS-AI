-- ==============================================================================
-- Kapis AI Platform - Sprint 3: Doctor weekly schedules
-- Apply manually (never auto-run), after 002_create_doctors.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/003_create_doctor_schedules.sql
--
-- One row per (doctor, day-of-week) rather than a single JSON blob per doctor,
-- so "which doctors work Mondays" is a plain indexed WHERE clause instead of
-- a JSON traversal - the same query the Slot Generator and the dashboard's
-- "Doctors Available Today" card both need.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.doctor_schedules (
  doctor_id        uuid NOT NULL REFERENCES clinic.doctors (id) ON DELETE CASCADE,
  day_of_week      varchar(10) NOT NULL
                     CHECK (day_of_week IN (
                       'monday', 'tuesday', 'wednesday', 'thursday',
                       'friday', 'saturday', 'sunday'
                     )),

  is_working       boolean NOT NULL DEFAULT true,
  morning_start    time NOT NULL DEFAULT '09:00',
  morning_end      time NOT NULL DEFAULT '13:00',
  afternoon_start  time NOT NULL DEFAULT '14:00',
  afternoon_end    time NOT NULL DEFAULT '18:00',

  updated_at       timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (doctor_id, day_of_week),
  CONSTRAINT doctor_schedules_morning_order CHECK (morning_start < morning_end),
  CONSTRAINT doctor_schedules_afternoon_order CHECK (afternoon_start < afternoon_end)
);

-- Slot Generator and "Doctors Available Today" both filter by day + working flag.
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_day_working
  ON clinic.doctor_schedules (day_of_week, is_working);

-- Reuses the trigger function created in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_doctor_schedules_set_updated_at ON clinic.doctor_schedules;
CREATE TRIGGER trg_doctor_schedules_set_updated_at
  BEFORE UPDATE ON clinic.doctor_schedules
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
