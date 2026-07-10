# api-server

NestJS backend for the Kapis AI Clinic Operating System - the single API layer
Angular and (from Phase 3 on) n8n both talk to. See `docs/Architecture.md` and the
project's Master Project Instructions for the full layered architecture.

Sprint 11 (Phase 2) shipped the backend foundation only - no business modules. Sprint 12
added the first one, `DoctorsModule`, replacing `apps/clinic-admin`'s mock `DoctorService`
with real REST calls. Sprint 13 adds `PatientsModule`, `ScheduleModule`, and
`AppointmentsModule`, replacing `PatientService`/`ScheduleService`/`AppointmentService` the
same way - Clinic Settings, Knowledge Base, Integrations, and Conversations still serve
mock data on the Angular side.

## What's here

- NestJS 11, strict TypeScript
- All routes are mounted under a global `/api` prefix (except `health`, kept unprefixed
  for docker-compose's healthcheck) - see `main.ts`.
- Prisma ORM connected to the existing `kapis_ai` Postgres database (`clinic` schema).
  Schema changes still ship as versioned SQL in `database/migrations/` - Prisma is a
  client here, not a migration tool.
- Swagger at `/docs`
- JWT access/refresh token architecture (`AuthModule`) - a global guard protects every
  route by default; opt out with `@Public()`. There is no `/auth/login` yet: `clinic.users`
  has no password column yet, so a real login endpoint is deferred until a Users API
  sprint wires one up. `/auth/refresh` and `/auth/me` exist to prove the token
  machinery end-to-end in the meantime. **Every business module's routes are `@Public()`**
  for the same reason - there's no way for Angular to obtain a real access token yet.
  Remove `@Public()` module by module once a login endpoint exists.
- `DoctorsModule` - `GET/POST /api/doctors`, `GET/PATCH/DELETE /api/doctors/:id`, backed
  by `clinic.doctors` (`database/migrations/002_create_doctors.sql`) via Prisma. Business
  rules (required fields, phone pattern, fee/duration minimums) mirror
  `apps/clinic-admin`'s `DoctorForm` validators.
- `PatientsModule` - `GET/POST /api/patients`, `GET/PATCH/DELETE /api/patients/:id`,
  backed by `clinic.patients` (`006_create_patients.sql`). Validators mirror
  `apps/clinic-admin`'s `PatientForm`.
- `ScheduleModule` - `GET/PUT /api/doctors/:doctorId/schedule` (`clinic.doctor_schedules`,
  `003_*`), full CRUD at `/api/doctor-leaves` (`clinic.doctor_leaves`, `004_*`) and
  `/api/clinic-holidays` (`clinic.clinic_holidays`, `005_*`). Also exports
  `ScheduleService.isDoctorAvailableOn()`, consumed by `AppointmentsModule`.
- `AppointmentsModule` - `GET/POST /api/appointments`, `GET/PATCH/DELETE
  /api/appointments/:id`, backed by `clinic.appointments` (`007_create_appointments.sql`).
  Owns every booking rule the Angular mock used to enforce client-side - doctor/patient
  exist and are active, doctor working/not on leave or holiday, no overlap (also backed by
  a DB-level GiST exclusion constraint), and `durationMinutes` is always snapshotted from
  the doctor's current `consultationDuration` server-side rather than trusted from the
  client. See `docs/DevelopmentGuide.md`'s "Patients, Schedule & Appointments APIs (Sprint
  13)" section for the full rundown.
- Global `ValidationPipe`, a global exception filter (`AllExceptionsFilter`), and a
  request logging interceptor.
- `GET /health` - liveness/readiness probe, includes a live Prisma `SELECT 1`.

## Running locally

Reads its environment from the **repo root** `.env` (copy `.env.example` at the repo
root if you haven't already) - `POSTGRES_*`, `API_PORT`, `CORS_ORIGIN`, `DATABASE_URL`,
`JWT_*`. There is no separate `apps/api-server/.env`.

```bash
# from the repo root, if not already running:
docker compose up -d postgres

cd apps/api-server
npm install
npm run prisma:generate
npm run start:dev        # http://localhost:3000, docs at /docs
```

## Running via Docker

```bash
docker compose up -d --build api
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run start:dev` | Watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run lint` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm test` | Unit tests (`*.spec.ts`) |
| `npm run test:e2e` | End-to-end tests (`test/*.e2e-spec.ts`), stubs Prisma so no live DB is required |
| `npm run prisma:generate` | Regenerate the Prisma client after editing `prisma/schema.prisma` |
| `npm run prisma:pull` | Introspect the live database into `prisma/schema.prisma` (for a future sprint adding real models) |
