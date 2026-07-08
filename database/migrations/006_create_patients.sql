-- ==============================================================================
-- Kapis AI Platform - Sprint 4: Patients table
-- Apply manually (never auto-run):
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/006_create_patients.sql
--
-- Foundation table for Sprint 5+ (appointment booking, WhatsApp intake, AI
-- receptionist conversation history all reference patients.id). Emergency
-- contact is modeled as three flat columns (not a child table) since a
-- patient has exactly one at a time - future multi-contact support can add
-- a `clinic.patient_contacts` table without touching this one.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.patients (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  first_name                  varchar(100) NOT NULL,
  last_name                   varchar(100) NOT NULL,
  gender                      varchar(10) NOT NULL
                                CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth               date NOT NULL
                                CHECK (date_of_birth <= CURRENT_DATE),

  mobile_number                varchar(20) NOT NULL,
  whatsapp_number               varchar(20) NOT NULL,
  email                        varchar(255) NOT NULL,

  blood_group                 varchar(10) NOT NULL DEFAULT 'unknown'
                                CHECK (blood_group IN
                                  ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown')),
  address                      text NOT NULL,

  emergency_contact_name         varchar(150) NOT NULL,
  emergency_contact_relationship varchar(100) NOT NULL,
  emergency_contact_phone        varchar(20) NOT NULL,

  allergies                   text NOT NULL DEFAULT '',
  medical_notes                text NOT NULL DEFAULT '',

  status                      varchar(10) NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active', 'inactive')),

  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- Patient list search (name), mobile lookup (WhatsApp inbound matching), and status filter.
CREATE INDEX IF NOT EXISTS idx_patients_last_name ON clinic.patients (last_name);
CREATE INDEX IF NOT EXISTS idx_patients_mobile_number ON clinic.patients (mobile_number);
CREATE INDEX IF NOT EXISTS idx_patients_whatsapp_number ON clinic.patients (whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_patients_status ON clinic.patients (status);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_patients_set_updated_at ON clinic.patients;
CREATE TRIGGER trg_patients_set_updated_at
  BEFORE UPDATE ON clinic.patients
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
