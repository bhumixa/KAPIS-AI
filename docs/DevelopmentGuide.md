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

Every top-level feature is built out as of Sprint 6 - Doctors (Sprint 2), Patients
(Sprint 4), Appointments (Sprint 5), and Settings (Sprint 6) are all reference examples
to copy; `ComingSoon` remains in `shared/` only as the pattern for whatever the *next*
feature area is. To build one out:

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

## Clinic Administration & Configuration (Sprint 6)

`features/settings/` replaces the `ComingSoon` placeholder with eight sub-pages sharing
one `SettingsNav` pill sub-nav (`''`, `business-hours`, `appointment-settings`, `users`,
`roles-permissions`, `ai-settings`, `whatsapp-settings`, `notification-settings`) - the
same flat-routes-plus-shared-sub-nav shape `features/doctors/schedule/` established in
Sprint 3. Three services split the eight pages by what they own, not by page count:

- **`ClinicService`** owns the clinic's own identity: `ClinicProfile` and
  `BusinessHours`. Both are singleton config (one clinic, one weekly schedule), so each
  gets a get/update pair rather than full CRUD - the same shape
  `ScheduleService.getSchedule()`/`updateSchedule()` used for a per-doctor singleton in
  Sprint 3. `ClinicService.isOpenNow` is a `computed()` that reads `businessHours()` plus
  the current wall-clock time (same local-time simplification the Sprint 3 schedule
  utils already made - no real IANA timezone conversion) - it's what backs the
  dashboard's Open/Closed chip.
- **`SettingsService`** owns the four operational configuration groups that aren't the
  clinic's identity or user/role management: Appointment Settings, AI Settings,
  WhatsApp Settings, Notification Settings. Same get/update-pair shape as
  `ClinicService`. AI Settings and WhatsApp Settings are explicitly placeholders - the
  service stores whatever's typed into `claudeApiKey`/`accessToken`/etc. but never calls
  Anthropic, OpenAI, or the Meta WhatsApp Cloud API. That's intentional: this sprint
  builds the *configuration surface*, not the integration.
- **`UserService`** owns both User Management (mock CRUD, same signal-plus-Observable
  shape as `DoctorService` - `users`/`userCount`, `getUsers()`/`createUser()`/
  `updateUser()`/`deleteUser()`) and the Roles & Permissions matrix
  (`rolePermissions`, `getRolePermissions(role)`, `updateRolePermission()`). They live in
  one service because a permission is meaningless without the role vocabulary users are
  assigned from - splitting them would just mean two services that are always read
  together.

### The Permission Model

`RolePermission` (`settings/models/permission.model.ts`) is one row per
`(role, module)`, each carrying its own `{ view, create, update, delete }` flags - the
same "one row per (entity, category)" shape `doctor_schedules` established in Sprint 3
for a weekly grid, applied here to a role x module grid instead of a JSON blob per role.
`PermissionModule` is a closed union of the nine areas listed in the brief (`dashboard`,
`doctors`, `patients`, `appointments`, `schedule`, `settings`, `ai`, `whatsapp`,
`reports`); `UserRole` (`admin`/`receptionist`/`doctor`) is **not** redefined in
`settings/` - it's imported from `core/models/user.model.ts`, the same union
`AuthService`'s dummy session `User` already uses, since they're the same real-world
role vocabulary. `RolesPermissions` (the page) selects one role via a
`mat-button-toggle-group` and renders that role's nine-row matrix through the
presentational `PermissionMatrix` component; toggling a checkbox calls
`UserService.updateRolePermission()` immediately (no separate "save" step, since each
checkbox is already a complete, addressable unit of change).

**No authentication changes yet, on purpose.** Nothing here is consulted by
`authGuard`/`AuthService`/`authInterceptor` - Roles & Permissions is a configuration
screen, not enforcement. Wiring `RolePermission` into actual route guarding is future
work once a real backend exists to authorize requests against.

### Future AI/WhatsApp/Notification Integration Points

Every field on the AI Settings, WhatsApp Settings, and Notification Settings pages is
already the shape a real integration will need - `SettingsService.aiSettings()`,
`.whatsappSettings()`, and `.notificationSettings()` are the exact read surface a future
`AiService`/`WhatsAppService` would inject to get `enabled`, API keys, `systemPrompt`,
`temperature`, `webhookUrl`, etc. without any of this sprint's UI code changing. The
placeholder-only rule matters here specifically: no HTTP call, timer, or webhook
listener exists yet, so enabling AI or WhatsApp today only persists a boolean in memory
- it does not turn anything on. `ClinicService.clinicProfile()`
(name/address/timezone/currency/language) is the other input a future AI receptionist
needs to answer "where are you and what timezone are you in," and
`ClinicService.businessHours()`/`isOpenNow` is what it needs to answer "are you open
right now" - both already live and already read by the dashboard banner, so a future AI
module reads the same source of truth a human staff member sees.

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
it needs generated `start_at`/`end_at` timestamptz columns to do that. Sprint 6 adds five
more: `008_create_clinics.sql` (clinic identity columns, plus `jsonb` columns for
business hours and the four settings groups - see the file's header comment for why
that's a deliberate JSONB exception to the `doctor_schedules`-style normalization this
project otherwise prefers), `009_create_users.sql` (no `role` column - role assignment is
many-to-many via `012`), `010_create_roles.sql`, `011_create_permissions.sql` (the
`RolePermission` matrix, one row per role x module), and `012_create_user_roles.sql` (the
users-roles join table). To add another:

1. Add `database/migrations/00N_description.sql` (never edit a merged migration -
   ship a new one for corrections).
2. Apply it manually against the running container, e.g.:
   ```bash
   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - < database/migrations/003_create_doctor_schedules.sql
   ```
3. Seed data (`database/seed/`) is applied the same way, after the migration it depends
   on - it is **not** auto-run by Postgres's `docker-entrypoint-initdb.d` mechanism,
   which only fires once, on first container start, before any migrations exist.
4. None of `002`-`012` are wired into the Angular app yet - `DoctorService`,
   `ScheduleService`, `PatientService`, `AppointmentService`, `ClinicService`,
   `SettingsService`, and `UserService` still serve mock data. Connecting them is out of
   scope until a real API layer exists; don't run these migrations against data you care
   about until then.

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
