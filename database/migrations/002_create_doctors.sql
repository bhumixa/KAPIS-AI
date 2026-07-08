-- ==============================================================================
-- Kapis AI Platform - Sprint 2: Doctors table
-- Apply manually (never auto-run):
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/002_create_doctors.sql
--
-- Foundation table for Sprint 3+ (appointment booking, availability, AI
-- scheduling, Google Calendar sync, WhatsApp booking all reference doctors.id).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.doctors (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  first_name             varchar(100) NOT NULL,
  last_name              varchar(100) NOT NULL,
  gender                 varchar(10) NOT NULL
                           CHECK (gender IN ('male', 'female', 'other')),

  specialization         varchar(150) NOT NULL,
  qualification          varchar(150) NOT NULL,
  experience_years       smallint NOT NULL DEFAULT 0
                           CHECK (experience_years >= 0),

  registration_number    varchar(50) NOT NULL,
  phone                  varchar(20) NOT NULL,
  email                  varchar(255) NOT NULL,

  consultation_fee       numeric(10, 2) NOT NULL
                           CHECK (consultation_fee > 0),
  consultation_duration  smallint NOT NULL DEFAULT 15
                           CHECK (consultation_duration >= 10),

  status                 varchar(10) NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'inactive')),

  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT doctors_registration_number_unique UNIQUE (registration_number),
  CONSTRAINT doctors_email_unique UNIQUE (email)
);

-- Doctor list search/filter (name, specialization) and status filter chip.
CREATE INDEX IF NOT EXISTS idx_doctors_last_name ON clinic.doctors (last_name);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON clinic.doctors (specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON clinic.doctors (status);

-- Keeps updated_at current without every application-layer UPDATE having to set it.
CREATE OR REPLACE FUNCTION clinic.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_doctors_set_updated_at ON clinic.doctors;
CREATE TRIGGER trg_doctors_set_updated_at
  BEFORE UPDATE ON clinic.doctors
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
