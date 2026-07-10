-- ==============================================================================
-- Kapis AI Platform - Sprint 5: Appointments table
-- Apply manually (never auto-run), after 002_create_doctors.sql and
-- 006_create_patients.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/007_create_appointments.sql
--
-- The core scheduling engine's table. `appointment_date`/`start_time`/
-- `end_time` are the columns the application reads and writes (mirroring the
-- Angular `Appointment` model exactly); `start_at`/`end_at` are generated
-- timestamptz columns that exist only to back the overlap-prevention
-- exclusion constraint below - Postgres range types need a single instant,
-- not a separate date + time.
-- ==============================================================================

-- Needed for the uuid "=" operator class inside the GiST exclusion constraint.
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS clinic.appointments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  patient_id           uuid NOT NULL REFERENCES clinic.patients (id) ON DELETE RESTRICT,
  doctor_id            uuid NOT NULL REFERENCES clinic.doctors (id) ON DELETE RESTRICT,

  appointment_date     date NOT NULL,
  start_time           time NOT NULL,
  end_time             time NOT NULL,
  -- Snapshotted from the doctor's consultation_duration at booking time - see
  -- the matching comment on the Angular `Appointment.durationMinutes` field.
  duration_minutes     smallint NOT NULL CHECK (duration_minutes > 0),

  start_at             timestamptz GENERATED ALWAYS AS
                          ((appointment_date + start_time) AT TIME ZONE 'UTC') STORED,
  end_at               timestamptz GENERATED ALWAYS AS
                          ((appointment_date + end_time) AT TIME ZONE 'UTC') STORED,

  appointment_type     varchar(20) NOT NULL
                          CHECK (appointment_type IN
                            ('consultation', 'follow-up', 'checkup', 'procedure', 'emergency')),
  status               varchar(10) NOT NULL DEFAULT 'scheduled'
                          CHECK (status IN ('scheduled', 'completed', 'cancelled')),

  notes                text NOT NULL DEFAULT '',

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT appointments_time_order CHECK (start_time < end_time),

  -- Booking rule "prevent overlapping appointments": two non-cancelled
  -- appointments for the same doctor can't occupy overlapping time ranges.
  -- Cancelled appointments are excluded via the WHERE clause so cancelling
  -- immediately frees the slot for a new booking.
  CONSTRAINT appointments_no_doctor_overlap EXCLUDE USING gist (
    doctor_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  ) WHERE (status <> 'cancelled')
);

-- Appointment list search/filter (date, doctor, status) and calendar/daily-schedule queries.
CREATE INDEX IF NOT EXISTS idx_appointments_date ON clinic.appointments (appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date
  ON clinic.appointments (doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON clinic.appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON clinic.appointments (status);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_appointments_set_updated_at ON clinic.appointments;
CREATE TRIGGER trg_appointments_set_updated_at
  BEFORE UPDATE ON clinic.appointments
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
