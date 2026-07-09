-- ==============================================================================
-- Kapis AI Platform - Sprint 7: FAQs table
-- Apply manually (never auto-run):
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/014_create_faqs.sql
--
-- Question/answer pairs the future AI receptionist draws on when answering
-- patients. `status` lets a draft FAQ be written and reviewed before it is
-- eligible for the AI to use (`published`).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.faqs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  question     text NOT NULL,
  answer       text NOT NULL,
  category     varchar(100) NOT NULL,

  status       varchar(10) NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('published', 'draft')),

  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faqs_category ON clinic.faqs (category);
CREATE INDEX IF NOT EXISTS idx_faqs_status ON clinic.faqs (status);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_faqs_set_updated_at ON clinic.faqs;
CREATE TRIGGER trg_faqs_set_updated_at
  BEFORE UPDATE ON clinic.faqs
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
