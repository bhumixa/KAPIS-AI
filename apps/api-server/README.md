# api-server

NestJS backend for the Kapis AI Clinic Operating System - the single API layer
Angular and (from Phase 3 on) n8n both talk to. See `docs/Architecture.md` and the
project's Master Project Instructions for the full layered architecture.

Sprint 11 (Phase 2) shipped the backend foundation only - no business modules. Sprint 12
added the first one, `DoctorsModule`, replacing `apps/clinic-admin`'s mock `DoctorService`
with real REST calls. Sprint 13 adds `PatientsModule`, `ScheduleModule`, and
`AppointmentsModule`, replacing `PatientService`/`ScheduleService`/`AppointmentService` the
same way. Sprint 14/15 added `N8nModule`, a real bridge to the n8n workflow engine. Sprint
16 adds `ConversationsModule` (the Conversation Engine), replacing `ConversationService`/
`MessageService`/`ConversationAssignmentService` the same way, plus read-only Prisma access
to `clinic.clinics` and the knowledge-base tables for context assembly. Sprint 17 adds
`AIOrchestratorModule` (the AI Orchestration Engine) - the backend every AI provider plugs
into, via the `AiProvider` interface. Sprint 18 adds `ClaudeModule`, the first (and only)
`AiProvider` implementation - `AIExecutionService` now makes a real HTTPS call to
Anthropic's Messages API instead of returning a mock response. Clinic Settings, the rest of
the Knowledge Base, and Integrations still serve mock data on the Angular side.

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
- `ConversationsModule` - `GET/POST /api/conversations`, `GET/PATCH
  /api/conversations/:id`, `GET /api/conversations/:id/context` (the full
  ConversationContext: patient, inferred doctor, upcoming/previous appointments, clinic
  profile + business hours, knowledge base), `GET/POST /api/conversations/:id/messages`
  (paginated; `?includeNotes=true` for the merged Conversation Timeline),
  `POST /api/conversations/:id/read`, and notes/assignments sub-routes - backed by
  `clinic.conversations`/`clinic.messages`/`clinic.conversation_notes`/
  `clinic.conversation_assignments` (`022`-`025`). Persist-only: no Claude or WhatsApp
  call happens anywhere in this module. See `docs/DevelopmentGuide.md`'s "Conversation
  Engine (Sprint 16)" section for the full rundown.
- `AIOrchestratorModule` - `GET /api/ai/context/:conversationId` (the AI ConversationContext:
  Sprint 16's context plus recent messages, internal notes, insurance providers, AI persona
  settings), `GET /api/ai/prompt/:conversationId` (prompt preview, no AI call),
  `POST /api/ai/generate` (runs the full pipeline through the real Claude provider and
  persists it), `GET /api/ai/history`, `GET /api/ai/stats`, `GET /api/ai/provider/health`
  (Sprint 18), and full CRUD at `/api/prompt-templates` - backed by
  `clinic.prompt_templates`/`clinic.ai_execution_history`/`clinic.ai_models` (`034`-`036`)
  plus read-only access to `clinic.insurance_providers`/`clinic.ai_prompt_settings`
  (`017`/`019`) and, as of Sprint 18, `clinic.ai_provider_logs` (`037`). See
  `docs/DevelopmentGuide.md`'s "AI Orchestration Engine (Sprint 17)" and "Real Claude
  Provider (Sprint 18)" sections for the full rundown.
- `ClaudeModule` (Sprint 18) - not routed directly; implements the `AiProvider` interface
  `AIOrchestratorModule` depends on with real HTTPS calls to Anthropic's Messages API
  (`ANTHROPIC_API_KEY`/`ANTHROPIC_MODEL`/`ANTHROPIC_API_URL`/`ANTHROPIC_MAX_TOKENS`/
  `ANTHROPIC_TEMPERATURE`/`ANTHROPIC_HTTP_TIMEOUT_MS`, all optional at boot). No streaming,
  no tool use, no vision - single-turn `system` + one `user` message per call.
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
