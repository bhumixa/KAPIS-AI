-- ==============================================================================
-- Kapis AI Platform - Sprint 16: Conversation Engine seed data
-- Apply manually, after the migrations it depends on (008, 009, 013, 014, 016, 018):
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/seed/002_conversation_engine_seed.sql
--
-- clinic.clinics and clinic.users were only just applied (Sprint 16) and are
-- otherwise empty - clinic.conversations.assigned_to_user_id and
-- clinic.conversation_assignments.assigned_to_user_id are both FKs into
-- clinic.users, so real rows there are a hard prerequisite for the Assignment
-- feature to persist at all, not optional demo flavor. IDs are fixed (not
-- gen_random_uuid()) so apps/clinic-admin's Settings UserService mock (still
-- Sprint 6 mock data - Settings has no backend yet) can reference the exact
-- same ids and its Assignment dropdown resolves to a user that genuinely
-- exists server-side. Idempotent via ON CONFLICT, safe to re-run.
-- ==============================================================================

INSERT INTO clinic.clinics (
  id, clinic_name, registration_number, address, city, state, country, postal_code,
  phone, email, time_zone, currency, language, business_hours
) VALUES (
  'db182f1e-65f6-4b2a-808a-0496dd8d8267',
  'Kapis Clinic',
  'REG-KAPIS-0001',
  '221B Health Street',
  'Mumbai',
  'Maharashtra',
  'India',
  '400001',
  '+91 90000 00000',
  'contact@kapis.clinic',
  'Asia/Kolkata',
  'INR',
  'English',
  '[
    {"day": "monday", "isOpen": true, "openTime": "09:00", "closeTime": "18:00", "lunchBreakStart": "13:00", "lunchBreakEnd": "14:00"},
    {"day": "tuesday", "isOpen": true, "openTime": "09:00", "closeTime": "18:00", "lunchBreakStart": "13:00", "lunchBreakEnd": "14:00"},
    {"day": "wednesday", "isOpen": true, "openTime": "09:00", "closeTime": "18:00", "lunchBreakStart": "13:00", "lunchBreakEnd": "14:00"},
    {"day": "thursday", "isOpen": true, "openTime": "09:00", "closeTime": "18:00", "lunchBreakStart": "13:00", "lunchBreakEnd": "14:00"},
    {"day": "friday", "isOpen": true, "openTime": "09:00", "closeTime": "18:00", "lunchBreakStart": "13:00", "lunchBreakEnd": "14:00"},
    {"day": "saturday", "isOpen": true, "openTime": "09:00", "closeTime": "13:00", "lunchBreakStart": "", "lunchBreakEnd": ""},
    {"day": "sunday", "isOpen": false, "openTime": "", "closeTime": "", "lunchBreakStart": "", "lunchBreakEnd": ""}
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO clinic.users (id, clinic_id, name, email, phone, status) VALUES
  ('4584e8bf-a157-4be1-bec1-20fceeaec66e', 'db182f1e-65f6-4b2a-808a-0496dd8d8267', 'Admin User',       'admin@kapis.clinic',        '+91 90000 00001', 'active'),
  ('8473bf7e-0b18-4548-bdcb-95ed6d8e5667', 'db182f1e-65f6-4b2a-808a-0496dd8d8267', 'Fatima Rizvi',      'fatima.rizvi@kapis.clinic', '+91 90000 00002', 'active'),
  ('f1dc00b2-27f5-4b07-b26b-9a81c75da514', 'db182f1e-65f6-4b2a-808a-0496dd8d8267', 'Dr. Aisha Khan',    'aisha.khan@kapis.clinic',   '+91 98765 43210', 'active'),
  ('354b148c-f4ed-4c9a-b3ce-263c9f69ba3b', 'db182f1e-65f6-4b2a-808a-0496dd8d8267', 'Dr. Rohan Mehta',   'rohan.mehta@kapis.clinic',  '+91 98765 43211', 'active'),
  ('7674e5c9-6565-435f-8113-058a36f601be', 'db182f1e-65f6-4b2a-808a-0496dd8d8267', 'Vikas Nair',        'vikas.nair@kapis.clinic',   '+91 90000 00005', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO clinic.services (name, category, description, duration_minutes, price, status) VALUES
  ('General Consultation', 'Consultation', 'Standard consultation with a general physician.', 20, 500.00, 'active'),
  ('Follow-up Visit', 'Consultation', 'Follow-up review of an existing treatment plan.', 15, 300.00, 'active')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.faqs (question, answer, category, status) VALUES
  ('What are your clinic hours?', 'We are open Monday to Saturday, 9 AM to 6 PM (closed for lunch 1-2 PM), and closed Sundays.', 'General', 'published'),
  ('Do you accept walk-ins?', 'We prioritize scheduled appointments, but walk-ins are seen based on availability.', 'Appointments', 'published')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.policies (title, type, content, status) VALUES
  ('Cancellation Policy', 'cancellation', 'Appointments can be cancelled or rescheduled up to 4 hours in advance without charge.', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.message_templates (name, type, subject, body, variables) VALUES
  ('Appointment Confirmation', 'appointment_confirmation', '', 'Hi {{patientName}}, your appointment with {{doctorName}} on {{date}} at {{time}} is confirmed.', ARRAY['patientName', 'doctorName', 'date', 'time'])
ON CONFLICT DO NOTHING;
