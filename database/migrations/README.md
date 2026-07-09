# Migrations

Versioned, incremental schema changes go here as product tables (patients, doctors,
appointments, messages, etc.) are introduced sprint by sprint.

Convention: `NNN_description.sql`, numbered sequentially and never edited after merge —
corrections ship as a new migration.

None of these are applied automatically or wired into the Angular app yet - every
service still serves mock data. Apply manually against the running container, e.g.:

```bash
docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - < database/migrations/002_create_doctors.sql
```

| Migration | Sprint | Adds |
| --- | --- | --- |
| `002_create_doctors.sql` | 2 | `clinic.doctors` |
| `003_create_doctor_schedules.sql` | 3 | `clinic.doctor_schedules` |
| `004_create_doctor_leaves.sql` | 3 | `clinic.doctor_leaves` |
| `005_create_clinic_holidays.sql` | 3 | `clinic.clinic_holidays` |
| `006_create_patients.sql` | 4 | `clinic.patients` |
| `007_create_appointments.sql` | 5 | `clinic.appointments` |
| `008_create_clinics.sql` | 6 | `clinic.clinics` |
| `009_create_users.sql` | 6 | `clinic.users` |
| `010_create_roles.sql` | 6 | `clinic.roles` |
| `011_create_permissions.sql` | 6 | `clinic.permissions` |
| `012_create_user_roles.sql` | 6 | `clinic.user_roles` |
| `013_create_services.sql` | 7 | `clinic.services` |
| `014_create_faqs.sql` | 7 | `clinic.faqs` |
| `015_create_doctor_profiles.sql` | 7 | `clinic.doctor_profiles` |
| `016_create_policies.sql` | 7 | `clinic.policies` |
| `017_create_insurance_providers.sql` | 7 | `clinic.insurance_providers` |
| `018_create_message_templates.sql` | 7 | `clinic.message_templates` |
| `019_create_ai_prompt_settings.sql` | 7 | `clinic.ai_prompt_settings` |
| `020_create_integrations.sql` | 8 | `clinic.whatsapp_integration`, `clinic.claude_integration`, `clinic.google_calendar_integration` |
| `021_create_webhooks.sql` | 8 | `clinic.webhooks` |
| `022_create_conversations.sql` | 9 | `clinic.conversations` |
| `023_create_messages.sql` | 9 | `clinic.messages` |
| `024_create_conversation_notes.sql` | 9 | `clinic.conversation_notes` |
| `025_create_conversation_assignments.sql` | 9 | `clinic.conversation_assignments` |
