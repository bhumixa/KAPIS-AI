# Kapis AI Platform

Kapis AI is an AI Automation Platform. The first product built on it is **Kapis Clinic
AI** - an AI-powered WhatsApp receptionist for clinics (appointment booking, patient
intake, doctor coordination).

This repository is the platform monorepo: the Angular admin console, the local
workflow-automation engine (n8n), and the database schema all live here so a second
product can be added later without re-architecting the foundation.

> **Sprint 5 scope.** Sprint 1 shipped the project foundation - workspace, Docker infra,
> Angular shell with dummy auth and a placeholder dashboard. Sprint 2 added **Doctor
> Management** (`apps/clinic-admin/src/app/features/doctors/`). Sprint 3 added **Doctor
> Schedule & Availability** - weekly working hours, leave, clinic holidays, and a slot
> generator (`features/doctors/schedule/`). Sprint 4 added **Patient Management**
> (`features/patients/`) - patient records, emergency contacts, and a live patient count
> on the dashboard. Sprint 5 adds the **Appointment Engine**
> (`features/appointments/`) - the core scheduling module: a booking wizard (patient ->
> doctor -> date -> available slot), an appointment list/calendar/daily-schedule view,
> and booking rules (active doctor/patient, doctor working that day, no overlaps) built
> entirely on top of the existing `DoctorService`/`PatientService`/`AvailabilityService`
> rather than duplicating any of that logic - all still on mock data, plus their future
> database tables (`database/migrations/002`-`007`, not yet wired up). WhatsApp, AI, and
> Google Calendar are **not** implemented yet; see
> [docs/Architecture.md](docs/Architecture.md) for what's coming and why the foundation
> is shaped the way it is.

## Repository layout

```
kapis-ai-platform/
  apps/
    clinic-admin/       Angular 20 admin console (this sprint's main deliverable)
  services/
    n8n-workflows/      Exported n8n workflow JSON (version-controlled automations)
  database/
    schema/             Bootstrap SQL run once by Postgres on first container start
    migrations/         Versioned, incremental schema changes (002-007, Sprint 2-5)
    seed/                Demo/sample data scripts (empty until Sprint 2+)
  docker/                Per-service Docker config/scratch dirs
  docs/                  Architecture, folder structure, dev guide, coding standards
  scripts/               One-off dev scripts
  docker-compose.yml     Postgres + pgAdmin + n8n local stack
  .env.example           Copy to .env and fill in secrets
```

See [docs/FolderStructure.md](docs/FolderStructure.md) for the full breakdown, including
inside `apps/clinic-admin`.

## Prerequisites

- Node.js 20 or 22 (Angular 20 does not officially support Node 24+; if you're on a
  newer Node via nvm, `nvm use 22` before running Angular CLI commands)
- Docker Desktop
- npm 10+

## Quick start

Run `./scripts/setup.sh` to do all of the below in one step, or follow it manually:

```bash
# 1. Environment
cp .env.example .env               # then edit secrets as needed

# 2. Infra: Postgres + pgAdmin + n8n
docker compose up -d
docker compose ps                  # wait until all 3 show "healthy"

# 3. Angular admin console
cd apps/clinic-admin
npm install
npm start                          # http://localhost:4200
```

Log in with **any** email/password - Sprint 1 authentication is a dummy stand-in for
the real JWT flow (see [docs/Architecture.md](docs/Architecture.md#authentication)).

| Service        | URL                          | Credentials (from `.env`)                    |
| -------------- | ----------------------------- | --------------------------------------------- |
| Angular app    | http://localhost:4200         | any email / any password (6+ chars)            |
| pgAdmin        | http://localhost:5050         | `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD` |
| n8n            | http://localhost:5678         | `N8N_BASIC_AUTH_USER` / `N8N_BASIC_AUTH_PASSWORD` |
| Postgres       | `localhost:5434` (see `.env`) | `POSTGRES_USER` / `POSTGRES_PASSWORD`          |

Postgres defaults to host port **5434** (not 5432) so this stack doesn't collide with
another local Postgres instance - change `POSTGRES_PORT` in `.env` if 5434 is also taken.

## Documentation

- [docs/Architecture.md](docs/Architecture.md) - why the system is shaped this way
- [docs/FolderStructure.md](docs/FolderStructure.md) - what lives where and why
- [docs/DevelopmentGuide.md](docs/DevelopmentGuide.md) - day-to-day dev workflow
- [docs/CodingStandards.md](docs/CodingStandards.md) - conventions enforced in review

## Tech stack

Angular 20 (standalone components, Signals) - Angular Material 3 - SCSS - RxJS - n8n -
PostgreSQL 17 - Docker - Claude API (Sprint 2+) - Meta WhatsApp Cloud API (Sprint 2+) -
Google Calendar API (Sprint 2+)
