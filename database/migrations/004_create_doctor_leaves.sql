-- ==============================================================================
-- Kapis AI Platform - Sprint 3: Doctor leave records
-- Apply manually (never auto-run), after 002_create_doctors.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/004_create_doctor_leaves.sql
--
-- Feeds both the "Doctors On Leave" dashboard card and the Slot Generator
-- (a doctor with an active leave row covering the requested date produces
-- zero available slots for that day, regardless of their weekly schedule).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.doctor_leaves (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id    uuid NOT NULL REFERENCES clinic.doctors (id) ON DELETE CASCADE,

  leave_type   varchar(20) NOT NULL
                 CHECK (leave_type IN ('vacation', 'sick', 'emergency', 'conference', 'other')),
  start_date   date NOT NULL,
  end_date     date NOT NULL,
  reason       text NOT NULL,

  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT doctor_leaves_date_order CHECK (end_date >= start_date)
);

-- "Is this doctor on leave on date X" is a range lookup scoped to one doctor.
CREATE INDEX IF NOT EXISTS idx_doctor_leaves_doctor_range
  ON clinic.doctor_leaves (doctor_id, start_date, end_date);

DROP TRIGGER IF EXISTS trg_doctor_leaves_set_updated_at ON clinic.doctor_leaves;
CREATE TRIGGER trg_doctor_leaves_set_updated_at
  BEFORE UPDATE ON clinic.doctor_leaves
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
