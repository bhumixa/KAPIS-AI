# Development Guide

## First-time setup

```bash
git clone <repo-url> kapis-ai-platform
cd kapis-ai-platform
cp .env.example .env                 # edit values if the defaults don't suit you

docker compose up -d
docker compose ps                    # wait until postgres/pgadmin/n8n all say "healthy"

cd apps/clinic-admin
npm install
npm start                            # http://localhost:4200, opens on save
```

Node 20 or 22 is recommended (Angular 20 does not officially support Node 24+; if
you manage versions with nvm, run `nvm use 22` in `apps/clinic-admin` before any
`ng`/`npm` command).

## Daily workflow

| Command (run from `apps/clinic-admin`) | What it does |
| --------------------------------------- | ------------- |
| `npm start`                             | Dev server with live reload at `:4200` |
| `npm run build`                         | Production build to `dist/clinic-admin` |
| `npm run watch`                         | Development-config build, rebuilds on save (no server) |
| `npm test`                              | Karma/Jasmine unit tests (Chrome) |
| `npm run lint`                          | ESLint (`@angular-eslint`) over `.ts` and `.html` |
| `npm run format`                        | Prettier, writes changes |
| `npm run format:check`                  | Prettier, fails on unformatted files (use in CI) |

Docker stack commands (run from repo root):

```bash
docker compose up -d       # start postgres + pgadmin + n8n in the background
docker compose ps          # check health status
docker compose logs -f n8n # tail logs for one service
docker compose down        # stop and remove containers, keep data volumes
docker compose down -v     # stop and DELETE all data (fresh start)
```

## Logging in

Sprint 1 has no backend, so `/login` accepts **any** email + a password of 6+
characters. There is nothing to seed or reset - every "login" creates a fresh dummy
session. See [Architecture.md](Architecture.md#authentication) for why this is safe to
build against without a real JWT service.

## Adding a new lazy-loaded feature

Settings still renders a shared `ComingSoon` placeholder; Doctors (Sprint 2), Patients
(Sprint 4), and Appointments (Sprint 5) are all built out and are reference examples to
copy. To build one out:

1. Open `src/app/features/<feature>/<feature>.routes.ts`.
2. Replace the `ComingSoon` `loadComponent` entry with your real component(s); add
   nested routes/resolvers in the same array - the parent route in `app.routes.ts`
   doesn't need to change. See `features/doctors/doctors.routes.ts` for a four-route
   example (`''`, `add`, `:id`, `:id/edit`), each with its own `data.breadcrumb`.
3. Give feature-local models/services a home inside `features/<feature>/`; only promote
   something to `core/` once a second feature genuinely needs it. Once a feature has more
   than one or two components, split `pages/` (routed screens with state, talk to the
   service) from `components/` (presentational, `input()`/`output()` only) - see
   `features/doctors/` for the pattern.
4. Keep `data: { breadcrumb: '...' }` on any route that should appear in the breadcrumb
   trail - it's picked up automatically.
5. Keep the service API-ready even while it returns mock data: expose a readonly signal
   for reactive reads (so other features/the dashboard can consume it without
   resubscribing) and `Observable`-returning methods for reads/writes (so the eventual
   `HttpClient` swap only touches the service file). `DoctorService` is the reference
   implementation.
6. If a feature grows a genuinely separate sub-capability (its own set of routed
   screens), nest it as `<feature>/<sub-feature>/` with its own `<sub-feature>.routes.ts`
   and `pages/`, and `loadChildren` it from the parent routes file - **but register the
   literal path before any `:param` sibling**, or the param route swallows it (see
   `features/doctors/doctors.routes.ts`'s `schedule` entry, registered before `:id`).
   Models/services stay in the parent feature's flat `models/`/`services/` folders if
   they're domain concepts the parent (not just the sub-feature) owns - see
   `features/doctors/schedule/` for the full pattern.

## The Appointment Engine (Sprint 5)

`features/appointments/` is the core scheduling module - it doesn't own doctor,
patient, or availability logic, it composes it:

- **Booking rules live in one place: `AppointmentService`.** `createAppointment()`/
  `updateAppointment()` both run `validateBooking()` before writing anything: doctor
  active (`DoctorService`), patient active (`PatientService`), doctor working that day
  with leave/holidays already excluded (`AvailabilityService.isDoctorAvailableOn()`),
  and no time overlap with that doctor's other non-cancelled appointments
  (`doTimeRangesOverlap()` in `utils/appointment-time.util.ts`). Nothing re-derives
  doctor schedules or leave/holiday rules - that stays in `AvailabilityService`/
  `ScheduleService` from Sprint 3.
- **Slot generation is one call: `AppointmentService.getAvailableSlots(doctorId, date,
  excludeAppointmentId?)`.** It builds the "already booked" list from its own
  `_appointments` signal (excluding cancelled appointments, and optionally the
  appointment being edited) and hands off to a new
  `AvailabilityService.getAvailableSlots()` method, which resolves the doctor's
  schedule/leaves/holidays and delegates to the same `generateAvailableSlots()` pure
  util the Sprint 3 Slot Generator already used - see the doc comment on
  `AvailabilityService.generateSlots()`, which anticipated exactly this reuse. Because
  it's a plain synchronous method reading signals (not an `Observable`), calling it
  inside a `computed()` (as `AppointmentBook`/`AppointmentEdit` do) makes the slot list
  recompute automatically the instant a booking changes `_appointments` - "available
  slots update immediately after booking" falls out of Angular's signal graph for free,
  no manual refresh needed.
- **The booking wizard (`pages/appointment-book/`) is signals, not a `FormGroup`
  ladder.** Each `mat-step` is a single selection (patient, doctor, date+slot, confirm),
  so there's nothing to validate per field - a `computed()` per step just tracks
  whether a selection has been made, and `mat-stepper`'s `linear` mode uses that to gate
  "Next".
- **`AppointmentEdit` reuses the same slot machinery as booking**, just with
  `excludeAppointmentId` set to the appointment's own id - otherwise its current slot
  would show as unavailable against itself.
- **Two different "day" views, on purpose.** Calendar View's Day tab lists every
  doctor's appointments for one day (calendar-style, mock-data only, `utils/
  calendar.util.ts` generates the month/week date grids). Daily Schedule is a
  front-desk day-sheet for *one* doctor: it calls `AvailabilityService.getAvailableSlots()`
  directly with an empty booked-list to get every possible slot for the day, then
  cross-references `AppointmentService`'s own appointments to mark each Free/Booked -
  it does not go through `AppointmentService.getAvailableSlots()`, since that method
  filters bookings out rather than surfacing them.
- **Dashboard integration** replaced the old hardcoded "Today's Appointments" card with
  `AppointmentService.todaysAppointmentCount()` and added three more live computed
  signals (`upcomingAppointmentCount`, `cancelledTodayCount`, `completedTodayCount`);
  "New Appointment" now navigates to `/appointments/book`.

## Adding a database migration

`database/migrations/002_create_doctors.sql` (Sprint 2) is the first one - use it as the
template; `003_create_doctor_schedules.sql`, `004_create_doctor_leaves.sql`, and
`005_create_clinic_holidays.sql` (Sprint 3) show the pattern for a table that
`REFERENCES clinic.doctors (id)` and reuses the existing `clinic.set_updated_at()`
trigger function instead of redefining it. `006_create_patients.sql` (Sprint 4) is a
standalone table (no FK to another `clinic` table) that still reuses the same trigger
function - a new entity doesn't need a new "how do I keep `updated_at` current" answer.
`007_create_appointments.sql` (Sprint 5) has two FKs (`patient_id`, `doctor_id`) and adds
a GiST exclusion constraint to enforce "no overlapping appointments per doctor" at the
database layer, not just in the Angular service - see the file's header comment for why
it needs generated `start_at`/`end_at` timestamptz columns to do that. To add another:

1. Add `database/migrations/00N_description.sql` (never edit a merged migration -
   ship a new one for corrections).
2. Apply it manually against the running container, e.g.:
   ```bash
   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - < database/migrations/003_create_doctor_schedules.sql
   ```
3. Seed data (`database/seed/`) is applied the same way, after the migration it depends
   on - it is **not** auto-run by Postgres's `docker-entrypoint-initdb.d` mechanism,
   which only fires once, on first container start, before any migrations exist.
4. None of `002`-`007` are wired into the Angular app yet - `DoctorService`,
   `ScheduleService`, `PatientService`, and `AppointmentService` still serve mock data.
   Connecting them is out of scope until a real API layer exists; don't run these
   migrations against data you care about until then.

## Environment variables

- Root `.env` (from `.env.example`) configures the Docker stack (Postgres/pgAdmin/n8n
  credentials, ports) and holds placeholders for secrets wired up in later sprints
  (JWT secret, Claude/OpenAI keys, WhatsApp, Google Calendar). It is git-ignored.
- `apps/clinic-admin/src/environments/environment.ts` (dev) and
  `environment.production.ts` (prod, swapped in at build time) hold Angular-side config
  like `apiBaseUrl`. These **are** committed - they hold no secrets, only base URLs.

## Troubleshooting

- **Postgres port already in use.** Another local Postgres (or a previous Kapis
  project) may already be bound to `5432`/`5433`. This stack defaults to host port
  `5434` for exactly that reason - change `POSTGRES_PORT` in `.env` if `5434` is also
  taken (`lsof -nP -iTCP -sTCP:LISTEN | grep 543`).
- **`docker compose up` fails with a name conflict.** Container/network/volume names
  are prefixed `kapis-clinic-*`. If you still hit a collision, another stack is using
  the exact same names - rename yours or stop the other stack.
- **Angular CLI prints "Node version is unsupported".** Non-fatal warning; the app
  still builds/serves. Switch to Node 20/22 to silence it.
- **Login redirects back to `/login` immediately.** Check the browser's localStorage
  for `kapis_auth_token`/`kapis_auth_user` - clearing site data resets the dummy
  session, which is expected (there's no real backend to persist it).
