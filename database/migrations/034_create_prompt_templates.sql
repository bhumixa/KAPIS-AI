-- ==============================================================================
-- Kapis AI Platform - Sprint 17: Prompt templates table
-- Apply manually (never auto-run):
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/034_create_prompt_templates.sql
--
-- Reusable prompt scaffolding for the AI Orchestration Engine
-- (apps/api-server/src/ai/) - PromptTemplateService owns full CRUD over this
-- table. `type` is the seven scenarios the Sprint 17 brief names verbatim
-- (greeting, appointment booking/cancellation, follow-up, prescription
-- reminder, general question, emergency escalation); a clinic may define more
-- than one template per type (e.g. two "greeting" variants), so `type` is not
-- unique. `variables` mirrors `018_create_message_templates.sql`'s text[]
-- choice for the same reason: a flat, order-independent list of merge-field
-- names (e.g. 'patientName', 'doctorName') with no attributes of its own.
-- Store only - PromptBuilderService reads active templates to assemble a
-- prompt; nothing here calls an AI provider.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.prompt_templates (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name                  varchar(200) NOT NULL,
  type                  varchar(30) NOT NULL
                          CHECK (type IN (
                            'greeting', 'appointment_booking', 'appointment_cancellation',
                            'follow_up', 'prescription_reminder', 'general_question',
                            'emergency_escalation'
                          )),
  description           text NOT NULL DEFAULT '',
  system_prompt         text NOT NULL,
  user_prompt_template  text NOT NULL,
  variables             text[] NOT NULL DEFAULT '{}',
  is_active             boolean NOT NULL DEFAULT true,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- PromptBuilderService looks up the active template for a given type first,
-- the same access pattern `018_create_message_templates.sql`'s index serves.
CREATE INDEX IF NOT EXISTS idx_prompt_templates_type ON clinic.prompt_templates (type);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_is_active ON clinic.prompt_templates (is_active);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_prompt_templates_set_updated_at ON clinic.prompt_templates;
CREATE TRIGGER trg_prompt_templates_set_updated_at
  BEFORE UPDATE ON clinic.prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
