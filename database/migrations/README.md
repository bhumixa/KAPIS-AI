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
