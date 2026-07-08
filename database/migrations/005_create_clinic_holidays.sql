-- ==============================================================================
-- Kapis AI Platform - Sprint 3: Clinic-wide holidays
-- Apply manually (never auto-run), after 002_create_doctors.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/005_create_clinic_holidays.sql
--
-- Unlike doctor_leaves, a holiday isn't scoped to one doctor - it zeroes out
-- the Slot Generator's output for every doctor on that date. `recurring_yearly`
-- means application code matches on month/day across years instead of the
-- exact stored date (see generate-available-slots.util.ts).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.clinic_holidays (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              varchar(150) NOT NULL,
  holiday_date      date NOT NULL,
  recurring_yearly  boolean NOT NULL DEFAULT false,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT clinic_holidays_name_date_unique UNIQUE (name, holiday_date)
);

CREATE INDEX IF NOT EXISTS idx_clinic_holidays_date ON clinic.clinic_holidays (holiday_date);

DROP TRIGGER IF EXISTS trg_clinic_holidays_set_updated_at ON clinic.clinic_holidays;
CREATE TRIGGER trg_clinic_holidays_set_updated_at
  BEFORE UPDATE ON clinic.clinic_holidays
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
