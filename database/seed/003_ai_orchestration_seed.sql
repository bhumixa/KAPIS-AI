-- ==============================================================================
-- Kapis AI Platform - Sprint 17: AI Orchestration Engine seed data
-- Apply manually, after 034_create_prompt_templates.sql and 036_create_ai_models.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/seed/003_ai_orchestration_seed.sql
--
-- Seeds the seven prompt templates the Sprint 17 brief names verbatim
-- (PromptTemplateService owns full CRUD over these afterwards - this just
-- gives the AI Draft Panel and dashboard something to show on a fresh
-- database) and the single 'mock' AiModel row AIExecutionService reads for
-- its deterministic fake responses. Idempotent via ON CONFLICT, safe to re-run.
-- ==============================================================================

INSERT INTO clinic.prompt_templates (name, type, description, system_prompt, user_prompt_template, variables, is_active) VALUES
  (
    'Standard Greeting', 'greeting',
    'Opening reply for a new or returning patient conversation.',
    'You are a warm, professional AI receptionist for {{clinicName}}. Keep replies short, friendly, and reassuring.',
    'Greet {{patientName}}, who just started a conversation with the clinic. Their message: "{{userQuestion}}"',
    ARRAY['clinicName', 'patientName', 'userQuestion'],
    true
  ),
  (
    'Appointment Booking', 'appointment_booking',
    'Helps a patient find and confirm an available appointment slot.',
    'You are an AI receptionist for {{clinicName}} helping patients book appointments. Use the provided doctor availability and clinic business hours only - never invent a time slot.',
    'Patient {{patientName}} wants to book an appointment. Their message: "{{userQuestion}}". Known upcoming appointments: {{upcomingAppointments}}.',
    ARRAY['clinicName', 'patientName', 'userQuestion', 'upcomingAppointments'],
    true
  ),
  (
    'Appointment Cancellation', 'appointment_cancellation',
    'Confirms and processes a patient-requested cancellation.',
    'You are an AI receptionist for {{clinicName}} handling an appointment cancellation. Reference the clinic''s cancellation policy from the knowledge base and stay polite.',
    'Patient {{patientName}} wants to cancel an appointment. Their message: "{{userQuestion}}". Upcoming appointments: {{upcomingAppointments}}.',
    ARRAY['clinicName', 'patientName', 'userQuestion', 'upcomingAppointments'],
    true
  ),
  (
    'Follow-up Check-in', 'follow_up',
    'Checks in on a patient after a recent visit.',
    'You are an AI receptionist for {{clinicName}} following up after a recent visit. Be warm and concise, and invite the patient to ask questions.',
    'Patient {{patientName}} was recently seen by {{doctorName}}. Their message: "{{userQuestion}}".',
    ARRAY['clinicName', 'patientName', 'doctorName', 'userQuestion'],
    true
  ),
  (
    'Prescription Reminder', 'prescription_reminder',
    'Reminds a patient about a prescription or refill.',
    'You are an AI receptionist for {{clinicName}} reminding a patient about their prescription. Do not give medical advice - direct clinical questions to {{doctorName}}.',
    'Patient {{patientName}} asked about their prescription. Their message: "{{userQuestion}}".',
    ARRAY['clinicName', 'patientName', 'doctorName', 'userQuestion'],
    true
  ),
  (
    'General Question', 'general_question',
    'Fallback template for questions that do not match a more specific scenario.',
    'You are an AI receptionist for {{clinicName}}. Answer using only the clinic''s FAQs, services, and policies provided in context. If you do not know, say a staff member will follow up.',
    'Patient {{patientName}} asked: "{{userQuestion}}".',
    ARRAY['clinicName', 'patientName', 'userQuestion'],
    true
  ),
  (
    'Emergency Escalation', 'emergency_escalation',
    'Escalates a message that looks like a medical emergency to staff immediately.',
    'You are an AI receptionist for {{clinicName}}. This message may describe a medical emergency. Respond with urgency, advise contacting emergency services if life-threatening, and flag this conversation for immediate staff attention.',
    'Patient {{patientName}} sent a message that may be an emergency: "{{userQuestion}}".',
    ARRAY['clinicName', 'patientName', 'userQuestion'],
    true
  )
ON CONFLICT DO NOTHING;

-- Fixed id (not gen_random_uuid()) so this row is stable across re-seeds and
-- AIExecutionService can log its exact id in ai_execution_history.model/provider
-- without a lookup query racing a fresh INSERT.
INSERT INTO clinic.ai_models (id, provider, model_name, display_name, model_type, is_active, is_default, config) VALUES
  (
    '2f6a6e0a-2b8b-4a52-9a9b-2b6e6f7d9a10',
    'mock',
    'kapis-mock-v1',
    'Kapis Mock Responder v1',
    'chat',
    true,
    true,
    '{"maxTokens": 512, "temperature": 0.7}'
  )
ON CONFLICT (provider, model_name) DO NOTHING;
