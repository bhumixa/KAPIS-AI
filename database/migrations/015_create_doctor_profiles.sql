-- ==============================================================================
-- Kapis AI Platform - Sprint 7: Doctor profiles table
-- Apply manually (never auto-run), after 002_create_doctors.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/015_create_doctor_profiles.sql
--
-- AI/patient-facing content about a doctor, kept in its own one-row-per-
-- doctor table rather than adding columns onto `clinic.doctors` - the same
-- ownership split the Angular app makes between `DoctorService` (owns
-- clinic.doctors) and `KnowledgeBaseService` (owns this table). No doctor
-- identity column (name, specialization, ...) is duplicated here, only the
-- `doctor_id` foreign key plus knowledge-base-only fields.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.doctor_profiles (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  doctor_id          uuid NOT NULL REFERENCES clinic.doctors (id) ON DELETE CASCADE,

  biography          text NOT NULL DEFAULT '',
  languages          text[] NOT NULL DEFAULT '{}',
  awards             text[] NOT NULL DEFAULT '{}',
  certifications     text[] NOT NULL DEFAULT '{}',
  publications       text[] NOT NULL DEFAULT '{}',
  interests          text[] NOT NULL DEFAULT '{}',
  video_url          text NOT NULL DEFAULT '',
  display_priority   smallint NOT NULL DEFAULT 0,

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT doctor_profiles_doctor_id_unique UNIQUE (doctor_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_profiles_display_priority
  ON clinic.doctor_profiles (display_priority);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_doctor_profiles_set_updated_at ON clinic.doctor_profiles;
CREATE TRIGGER trg_doctor_profiles_set_updated_at
  BEFORE UPDATE ON clinic.doctor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
