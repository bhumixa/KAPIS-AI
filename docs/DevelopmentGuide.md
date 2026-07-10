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

# in a second terminal - the backend (Sprint 11+)
cd apps/api-server
npm install
npm run prisma:generate
npm run start:dev                    # http://localhost:3000, docs at /docs
```

Node 20 or 22 is recommended (Angular 20 does not officially support Node 24+; if
you manage versions with nvm, run `nvm use 22` in `apps/clinic-admin` before any
`ng`/`npm` command).

`apps/api-server` reads its configuration from the **repo root** `.env`, not its own -
see [Environment variables](#environment-variables) below.

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

| Command (run from `apps/api-server`) | What it does |
| --------------------------------------- | ------------- |
| `npm run start:dev`                     | Watch mode at `:3000`, Swagger at `/docs` |
| `npm run build`                         | Compile to `dist/` |
| `npm test` / `npm run test:e2e`         | Unit tests / end-to-end tests (e2e stubs Prisma, no live DB needed) |
| `npm run lint`                          | ESLint |
| `npm run format` / `format:check`       | Prettier |
| `npm run prisma:generate`               | Regenerate the Prisma client after editing `prisma/schema.prisma` |

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

Every top-level feature is built out as of Sprint 9 - Doctors (Sprint 2), Patients
(Sprint 4), Appointments (Sprint 5), Settings (Sprint 6), Knowledge Base (Sprint 7),
Integrations (Sprint 8), and Conversations (Sprint 9) are all reference examples to
copy; `ComingSoon` remains in `shared/` only as the pattern for whatever the *next*
feature area is - note that Conversations itself had **no** `ComingSoon` route to
replace (Sprint 8 never wired one up), so its `conversations.routes.ts`/nav
entry/`ROUTE_SEGMENTS` value were all added fresh rather than following step 2 below
literally; every feature after it should still expect a placeholder to replace. To
build one out:

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

- **Booking rules lived in `AppointmentService.validateBooking()` here in Sprint 5 -
  as of Sprint 13 they live in `apps/api-server`'s `AppointmentsService` instead** (doctor/
  patient exist and are active, doctor working that day with leave/holidays excluded, no
  time overlap, duration snapshot); see "Patients, Schedule & Appointments APIs (Sprint
  13)" below for the full rundown. `AppointmentService.getAvailableSlots()` (next bullet)
  is unaffected - slot generation is still a client-side read, not a booking write.
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

## Knowledge Base (Sprint 7)

`features/knowledge-base/` replaces the `ComingSoon` placeholder with seven sub-pages
sharing one `KnowledgeBaseNav` pill sub-nav (`''`, `faqs`, `doctor-profiles`, `policies`,
`insurance-providers`, `message-templates`, `ai-prompt-settings`) - the same flat-routes-
plus-shared-sub-nav shape `SettingsNav` used in Sprint 6. Unlike Settings' three services
split by ownership, this sprint's brief asks for a single **`KnowledgeBaseService`**
covering all seven entities - Services, FAQs, Doctor Profile extensions, Policies,
Insurance Providers, and Message Templates all get full CRUD (signal-plus-Observable,
same shape as `DoctorService`); AI Prompt Settings gets a get/update pair, the same
singleton-config shape `ClinicService`/`SettingsService` established in Sprint 6.

- **Doctor Profiles extends `DoctorService`'s doctors without duplicating them.**
  `DoctorProfileExtension` (`knowledge-base/models/doctor-profile-extension.model.ts`)
  only ever stores a `doctorId` foreign key plus AI/patient-facing content (biography,
  languages, awards, certifications, publications, interests, video URL, display
  priority) - never name, specialization, fee, or any field `Doctor` already owns. The
  `DoctorProfiles` page builds its table by joining `DoctorService.doctors()` with
  `KnowledgeBaseService.doctorProfileExtensions()` in a `computed()`; the row's "Add
  Profile"/"Edit Profile" button opens `DoctorProfileForm`, which shows the doctor's name
  read-only and writes only extension fields via
  `KnowledgeBaseService.saveDoctorProfileExtension()` (a single upsert-shaped call, since
  the page doesn't need to know whether a doctor already has an extension row).
- **Six of the seven pages are dialog-CRUD** (`ServiceForm`, `FaqForm`, `PolicyForm`,
  `InsuranceProviderForm`, `MessageTemplateForm`, `DoctorProfileForm`), matching Sprint
  6's `UserForm` pattern rather than routed add/edit pages - none of these entities have
  a detail view, so a second route per entity would add navigation with nothing to show.
- **`MessageTemplate.variables` is edited as a comma-separated text field**, not a chip
  editor - it is a flat, order-independent list of merge-field names (`patientName`,
  `doctorName`, ...) with no per-item attributes, so a richer chip UI would be
  overhead the field doesn't need. The same simplification is used for `DoctorProfileForm`'s
  languages/awards/certifications/publications/interests fields.
- **Dashboard integration** added three more live cards - `KnowledgeBaseService
  .serviceCount()`, `.faqCount()`, `.templateCount()` - next to the Sprint 5/6 cards.

## Integration Layer (Sprint 8)

`features/integrations/` replaces the `ComingSoon` placeholder with five sub-pages
sharing one `IntegrationsNav` pill sub-nav (`''`, `whatsapp`, `claude`, `google-calendar`,
`webhooks`) - the same flat-routes-plus-shared-sub-nav shape `KnowledgeBaseNav` used in
Sprint 7. One **`IntegrationService`** covers all four integrations, the same
single-service shape Sprint 7's `KnowledgeBaseService` used.

- **This sprint is architecture and configuration only.** No WhatsApp message is sent, no
  Claude API is called, no Google Calendar API is called, anywhere in this code. "Test
  Connection" on each of the three provider pages calls a mocked
  `IntegrationService.test*Connection()` method - `delay(600)` plus a canned success
  `IntegrationTestResult`, exactly the way every other CRUD method in this app mocks a
  future `HttpClient` call. It updates the integration's `status` signal (`connected`);
  nothing about a real network request happens.
- **`status` vs. `enabled` are two different concepts, deliberately not merged.**
  `enabled` (Claude, Google Calendar) is a user toggle - "I want this integration on."
  `status` (all three) is a read-only `connected`/`disconnected`/`error` value that only
  a Test Connection call changes - never a form field. WhatsApp has no `enabled` field
  per the brief; its `status` alone carries that meaning.
- **`IntegrationStatusChip` is one shared presentational component**, reused by all three
  config pages, all four Integrations Dashboard cards, and the main Dashboard's new
  integration health row - one place to change if the status vocabulary or its colors
  ever change.
- **Webhooks is the one entity with full CRUD**, using Sprint 7's dialog-CRUD shape
  (`WebhookForm` opened via `MatDialog.open(...)`, matching `UserForm`/`ServiceForm`).
  Its `events` field is a `mat-select multiple` over a fixed `WEBHOOK_EVENTS` vocabulary,
  not free text - unlike Sprint 7's `MessageTemplate.variables` (an open-ended list of
  merge-field names), webhook events are real system event names an eventual dispatcher
  will match against, so a typo should be impossible to make, not just possible to fix.
- **The Integrations Dashboard and the main Dashboard's health row are two different
  views of the same signals, not duplicated state.** Both read
  `IntegrationService.whatsapp()`/`.claude()`/`.googleCalendar()`/`.activeWebhookCount()`/
  `.webhookCount()` directly - there's no separate "summary" model to keep in sync.

## Conversation Center (Sprint 9)

`features/conversations/` replaces the `Conversations` `ComingSoon` placeholder with a
two-route feature (`''` Inbox, `:id` Conversation Details) - there's no shared sub-nav
here like `SettingsNav`/`KnowledgeBaseNav`/`IntegrationsNav`, since two routes with no
sibling list don't need one. Three services split the work exactly the way the brief
named them:

- **`ConversationService`** owns conversations (`status`, `tags`) and internal notes -
  the same "one service, no independent lifecycle to justify splitting" reasoning
  Sprint 7's `KnowledgeBaseService` used for its seven entities.
- **`MessageService`** owns the message timeline (`getMessagesForConversation()`,
  `getUnreadCount()`, `getLastMessage()` - plain sync methods called from inside a
  `computed()`, the same idiom `AppointmentService.getPatientName()` established) and
  `sendMessage()`/`markConversationRead()` as the Observable-returning writes.
- **`ConversationAssignmentService`** owns assignment as append-only history
  (`assign()`/`unassign()`/`getAssignmentHistory()`), not just a mutable pointer -
  `Conversation.assignedToUserId` still exists for cheap list-view reads, but it's kept
  in sync by a **synchronous** `ConversationService.setAssignedUser()` call from inside
  `ConversationAssignmentService`'s own `delay(300)` tap, not a second
  Observable-returning method. (An earlier version composed two independently-delayed
  Observables here and the UI visibly lagged the "assigned" toast - see
  `Architecture.md`'s Conversation Center section for the full story if you're adding a
  similar cross-service write.)

**Reactivity note if you extend Conversation Details**: unlike Patient/Appointment
Details (`toSignal(getX(id))`, a one-shot snapshot), every read on this page is a
`computed()` sourced directly from the owning service's live signal
(`conversationService.conversations().find(...)`, not
`toSignal(conversationService.getConversation(id))`). If you add a new read here, follow
that pattern - a one-shot Observable capture won't refresh when a sibling action (send
reply, change status, assign, tag, note) mutates the underlying signal without a
navigation in between.

**AI Draft Panel is intentionally not backed by a service.** `Generate`/`Regenerate`
pick from three canned local templates and simulate latency with
`of(...).pipe(delay(900))` for consistency with every other mock in this app, but there
is no `AiDraftService`, no `HttpClient` call, and no read from `IntegrationService`'s
Claude config or Knowledge Base's `AIPromptSettings`. Wiring an actual provider is
future work, same "architecture and configuration only" boundary Sprint 8 drew for its
own three integrations.

**If you touch `ConversationList`** (the inbox row component): it's plain flex markup,
not `mat-list-item` + `matListItemTitle`/`matListItemLine` - Material's list directives
size each row off a fixed line-count grid that overlapped once a third content line
(status chip + assignee) was added. Don't reach for `matListItemLine` for a row with
more than two lines of genuinely different content without checking it renders
correctly first.

## Backend Foundation (Sprint 11)

`apps/api-server` is a NestJS 11 project - the first piece of Phase 2. Sprint 11 built
the foundation (Prisma connection, auth token architecture, Swagger, global error
handling) with no business endpoints. Sprint 12 adds the first one - `DoctorsModule` -
and rewires `apps/clinic-admin`'s `DoctorService` to call it, so the Doctors feature is
the first no-longer-mocked slice of the app; every other feature's service still serves
mock data. See `apps/api-server/README.md` for the full rundown.

Points worth knowing before extending it:

- **Prisma is a client, not a migration tool here.** Schema changes still ship as
  versioned SQL in `database/migrations/` (same as every other sprint) - Prisma's
  `prisma/schema.prisma` should be kept in sync by hand or via `npm run prisma:pull`
  after a migration is applied, not by running `prisma migrate`.
- **Prisma is pinned to 6.19.3**, not the 7.x line. Prisma 7 requires a `prisma.config.ts`
  + driver-adapter setup (`@prisma/adapter-pg`) that's a bigger architectural change
  than this foundation sprint needs; revisit once a business module actually needs
  something 7.x offers.
- **Every route is protected by a global `JwtAuthGuard` by default.** Add `@Public()`
  to a controller/handler to opt out (see `HealthController`, `AuthController#refresh`).
  Business modules don't need to remember to guard themselves - `DoctorsModule` (Sprint
  12) opts every route back out with `@Public()` anyway, since there's still no
  `/auth/login` for Angular to get a real token from; revisit once one exists.
- **There is no `POST /auth/login` yet.** `clinic.users` (Sprint 6) has no password
  column, so there's no credential store to check against. `AuthModule` ships the
  token-signing/refresh/guard machinery only; a login endpoint lands once a Users API
  sprint adds real credentials.
- **`apps/api-server` has no `.env` of its own** - it reads the repo root `.env` (see
  `ConfigModule.forRoot({ envFilePath: ['.env', '../../.env'] })` in `app.module.ts`),
  same file the Docker stack uses.

## Patients, Schedule & Appointments APIs (Sprint 13)

Sprint 13 adds three more business modules to `apps/api-server` -
`PatientsModule`, `ScheduleModule` (doctor weekly schedules, doctor leave,
clinic holidays), and `AppointmentsModule` - and rewires
`apps/clinic-admin`'s `PatientService`, `ScheduleService`, and
`AppointmentService` to call them, the same mock-to-`HttpClient` swap Sprint
12 did for `DoctorService`. `AvailabilityService` needed **no changes at
all**: it only ever read `DoctorService`/`ScheduleService`'s public signals,
never fetched data itself, so once those two services started serving real
data it did too. Every feature's UI is unchanged - only five service files
(four rewired, one deleted) and three new backend modules.

- **`ScheduleModule` covers three tables, not one.** `GET/PUT
  /doctors/:doctorId/schedule` (`clinic.doctor_schedules`), full CRUD at
  `/doctor-leaves` (`clinic.doctor_leaves`) and `/clinic-holidays`
  (`clinic.clinic_holidays`) all live in one module because
  `AppointmentsService` needs all three together to answer one question -
  see `ScheduleService.isDoctorAvailableOn()` below. There is no "list every
  doctor's schedule" endpoint (the brief only asked for the per-doctor
  route), so `apps/clinic-admin`'s `ScheduleService` keeps its
  all-doctors-at-once `schedules` signal fed by fetching each doctor in
  `DoctorService.doctors()` individually inside an `effect()` and merging
  the results - the same "many small requests, one aggregate signal" shape
  `AvailabilityService.doctorsAvailableToday` already relied on for reads.
- **A never-configured doctor still gets a schedule.** `GET
  /doctors/:doctorId/schedule` returns Mon-Fri 09:00-13:00/14:00-18:00,
  Sat/Sun off for any doctor with no `doctor_schedules` rows yet - the exact
  default the Sprint 3 mock used - rather than a 404 or an empty week. `PUT`
  always replaces the full week (the Angular weekly editor always submits
  all 7 days) as one transaction of 7 upserts.
- **Booking rules moved server-side, per the brief.** `AppointmentsService`
  now owns every rule the Sprint 5 mock's `AppointmentService.validateBooking()`
  used to enforce: doctor/patient exist (404) and are active (400), the
  doctor is working that day with leave/holidays already excluded (400, via
  `ScheduleService.isDoctorAvailableOn()` - the backend's equivalent of
  `AvailabilityService.isDoctorAvailableOn()`), no overlap with the doctor's
  other non-cancelled appointments (409, backed by the DB's GiST exclusion
  constraint as a second line of defense), and `durationMinutes` is always
  snapshotted from the doctor's *current* `consultationDuration` server-side
  - a client-submitted value is accepted (so the existing booking/edit pages
  don't need to change what they send) but always overwritten. Angular's
  `AppointmentService.createAppointment()`/`updateAppointment()` lost
  `validateBooking()` entirely; they just map a 400/404/409 response body's
  `message` back onto a plain `Error` so `appointment-book.ts`/
  `appointment-edit.ts`'s existing `error.message` snackbar handlers keep
  working unchanged. The now-dead `doTimeRangesOverlap()` util
  (`appointments/utils/appointment-time.util.ts`) was deleted along with it;
  the same check now lives in `apps/api-server/src/appointments/appointment-time.util.ts`.
- **Status-only updates skip re-validation.** `AppointmentEdit`'s full
  reschedule PATCH and `AppointmentList`/`AppointmentDetails`' cancel/complete
  PATCH (`{ status }` alone) both hit the same `PATCH /appointments/:id` -
  `AppointmentsService.update()` only re-runs booking validation when a
  booking-relevant field (patient/doctor/date/times) is actually present in
  the body, so cancelling an appointment can never be blocked by a rule that
  only matters at booking time (an inactive doctor, a since-added holiday) -
  the same bypass the Sprint 5 mock's separate `setStatus()` method gave for
  free.
- **Slot generation stays client-side.** There's no "list available slots"
  endpoint - `AppointmentService.getAvailableSlots()` still composes
  `AvailabilityService`/`generateAvailableSlots()` exactly as Sprint 5 left
  it, reading the doctor's schedule/leaves/holidays (now real data) and the
  live `_appointments` signal. The create/update call is what confirms a
  chosen slot is still actually bookable.
- **Bug fix, not a new migration:** `007_create_appointments.sql`'s overlap
  constraint used `tsrange(start_at, end_at)` on `timestamptz` columns, which
  Postgres rejects (`tsrange` is for timezone-less `timestamp`) - the
  migration had never actually been applied before Sprint 13 needed it. Fixed
  in place to `tstzrange(...)` per the "never edit a merged migration" rule's
  own exception for genuine bugs, not a `008_*` correction, since the file
  had never successfully run against any database.

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
users-roles join table). Sprint 7 adds seven more: `013_create_services.sql`,
`014_create_faqs.sql`, `016_create_policies.sql`, and `017_create_insurance_providers.sql`
are all standalone tables following the `006_create_patients.sql` shape;
`015_create_doctor_profiles.sql` has a `doctor_id` FK to `clinic.doctors` with a `UNIQUE`
constraint (one profile per doctor) and uses `text[]` columns for the
languages/awards/certifications/publications/interests lists; `018_create_message_templates.sql`
also uses a `text[]` column for `variables`; `019_create_ai_prompt_settings.sql` is a
single-row table enforced with the `id smallint CHECK (id = 1)` singleton trick, rather
than the JSONB-column-on-`clinics` approach `008` used for the Sprint 6 settings groups -
see that file's header comment for why. Sprint 8 adds two more: `020_create_integrations.sql`
bundles three singleton tables (`clinic.whatsapp_integration`, `clinic.claude_integration`,
`clinic.google_calendar_integration`), each using the same `id smallint CHECK (id = 1)`
trick as `019`, since each integration's fields are genuinely different and a single
generic table with nullable columns for every field of every type would be worse than
three small typed tables; `021_create_webhooks.sql` mirrors `018`'s `text[]` choice for
`events`. Sprint 9 adds four more: `022_create_conversations.sql` has a `patient_id` FK
(`ON DELETE CASCADE`, unlike appointments' `RESTRICT`) and a nullable
`assigned_to_user_id` FK (`ON DELETE SET NULL`) mirroring
`ConversationService.setAssignedUser()`'s denormalized pointer; `023_create_messages.sql`
is the one table here with no `updated_at`/trigger, since a message is append-only
except for its `read` flag; `024_create_conversation_notes.sql` is a standalone
one-to-many table, the same reasoning `004_create_doctor_leaves.sql` used;
`025_create_conversation_assignments.sql` is the durable form of
`ConversationAssignmentService`'s append-only history, with `assigned_to_user_id` as
`ON DELETE CASCADE` (unlike `022`'s `SET NULL`) since a history row naming a
since-deleted user is no longer meaningful to keep. To add another:

1. Add `database/migrations/00N_description.sql` (never edit a merged migration -
   ship a new one for corrections).
2. Apply it manually against the running container, e.g.:
   ```bash
   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - < database/migrations/003_create_doctor_schedules.sql
   ```
3. Seed data (`database/seed/`) is applied the same way, after the migration it depends
   on - it is **not** auto-run by Postgres's `docker-entrypoint-initdb.d` mechanism,
   which only fires once, on first container start, before any migrations exist.
4. As of Sprint 13, `002`-`007` are all wired up: `DoctorService` (Sprint 12), and
   `PatientService`/`ScheduleService`/`AppointmentService` (Sprint 13) all call their real
   API modules instead of serving mock data. `ClinicService`, `SettingsService`,
   `UserService`, `KnowledgeBaseService`, `IntegrationService`, `ConversationService`,
   `MessageService`, and `ConversationAssignmentService` still serve mock data -
   connecting each is out of scope until its own sprint adds the matching API module;
   don't run `008`-`025` against data you care about until then.

## Environment variables

- Root `.env` (from `.env.example`) configures the Docker stack (Postgres/pgAdmin/n8n
  credentials, ports), `apps/api-server` (`API_PORT`, `CORS_ORIGIN`, `DATABASE_URL`,
  `JWT_*`), and holds placeholders for secrets wired up in later sprints (Claude/OpenAI
  keys, WhatsApp, Google Calendar). It is git-ignored. `apps/api-server` has no `.env`
  of its own - see [Backend Foundation (Sprint 11)](#backend-foundation-sprint-11).
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
  session, which is expected (Angular still doesn't call the real backend yet).
- **`apps/api-server` fails to boot with a `Config validation error`.** A required env
  var (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`) is missing or
  too short - copy `.env.example` to `.env` at the repo root if you haven't, and note
  both JWT secrets must be 16+ characters.
- **`GET /health` returns `database: "down"`.** Postgres isn't reachable at
  `DATABASE_URL` - run `docker compose ps` and confirm `postgres` is healthy, and that
  `DATABASE_URL`'s port matches `POSTGRES_PORT` (host runs) or is `postgres:5432` (the
  `api` container itself).
