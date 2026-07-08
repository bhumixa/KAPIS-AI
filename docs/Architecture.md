# Architecture

This document explains the *why* behind Sprint 1's structure - the code shows the
*what*. Read this before extending the app so new work lands in the right layer.

## Guiding principles

1. **Clean Architecture, pragmatically applied.** Domain concepts (models), application
   logic (services), and delivery mechanisms (components/routes) are separated, but we
   don't introduce ports/adapters ceremony a 4-person clinic-admin app doesn't need yet.
2. **SOLID at the module boundary, not inside every function.** Services have one job
   (`TokenStorageService` only touches `localStorage`; `AuthService` only owns session
   state); components depend on injected services, never on `localStorage`/`fetch`
   directly.
3. **Every Sprint 1 decision anticipates Sprint 2+ without building it early.**
   Interceptors, environments, and the JWT-shaped `AuthService` API exist now so the
   real backend integration is additive, not a rewrite.

## Why standalone components, not NgModules

The brief says "Core Module / Shared Module / Layout Module" - this is implemented as
**folders and conventions**, not `NgModule` classes. Angular 20's CLI schematics no
longer scaffold `NgModule`s by default; standalone components + functional
providers/guards/interceptors are the current Angular team's recommended default and
what every `ng generate` in this repo produces. The folder names (`core/`, `shared/`,
`layout/`, `features/`) still enforce the same dependency direction an `NgModule` would:

```
features/  -> shared/, core/, layout/ (never the other way)
layout/    -> shared/, core/
shared/    -> core/
core/      -> (nothing app-specific)
```

`core/` has no `providedIn: 'root'` re-export barrel or module - Angular's DI tree-shakes
`@Injectable({ providedIn: 'root' })` services automatically, so a `CoreModule.forRoot()`
pattern would be pure ceremony here.

## Folder responsibilities (`apps/clinic-admin/src/app`)

- **`core/`** - singletons and cross-cutting concerns used everywhere: auth/token/
  loading services, guards, HTTP interceptors, app-wide models (`User`, `NavItem`,
  `Breadcrumb`), constants (route paths, storage keys, nav config), and small pure
  utilities. Nothing here imports from `features/`.
- **`shared/`** - dumb, reusable UI with no feature-specific knowledge: `Loading`,
  `NotFound`, `ComingSoon`, `Breadcrumb`, `ConfirmDialog`. `ComingSoon` reads its title
  from route `data` so one component serves every not-yet-built nav item (down to
  `appointments`/`settings` as of Sprint 4, now that `patients` has a real feature).
  `ConfirmDialog` (Sprint 3) was promoted here from a doctors-only
  `DoctorDeleteDialog` once Doctor Leave and Clinic Holiday delete needed the identical
  yes/no dialog shell - a second and third consumer is exactly the point at which
  `CodingStandards.md`'s "add the abstraction when it's needed" rule fires. Patient delete
  (Sprint 4) is its fourth consumer, and `patients/` has no `patient-delete-dialog` at all
  as a result - `doctor-delete-dialog` predates the promotion and was left as-is rather
  than churned into a `ConfirmDialog` call for a working, untouched Sprint 2 file.
- **`layout/`** - page *shells*, not page content: `DashboardLayout` (toolbar + sidenav +
  breadcrumb + `<router-outlet>`) and `LoginLayout` (centered, unauthenticated). Feature
  routes render *inside* these shells; the shells never know what feature is active.
- **`features/`** - one folder per business capability (`auth`, `dashboard`, `doctors`,
  `patients`, `appointments`, `settings`). Each is lazy-loaded independently. Feature-only
  models (e.g. `SummaryCard` in `dashboard/`, `Doctor`/`DoctorInput` in `doctors/`,
  `Patient`/`PatientInput` in `patients/`) stay local to the feature instead of polluting
  `core/models/`. `doctors/` is the first feature with real depth - it splits into
  `pages/` (routed screens: list, add, edit, details) and `components/` (reusable pieces
  those pages assemble: table, form, card, delete dialog) - see "Doctor Management" below.
  Sprint 3 adds a `schedule/` sub-feature inside `doctors/` (its own `pages/`, `utils/`,
  and routes file) for the same reason `doctors/` itself split into `pages/`/
  `components/` - see "Doctor Schedule & Availability" below. Sprint 4's `patients/`
  copies the `doctors/` `pages/`/`components/` split exactly (see "Patient Management"
  below) - by the third feature built this way, deviating from it would need its own
  justification.

## Authentication

Sprint 1 has no backend, so `AuthService.login()` fabricates a user and a fake token
after a simulated delay - but its **public shape is identical to what a real JWT call
will return** (`Observable<AuthResult>` with `{ token, user }`). This means:

- `TokenStorageService` is the only place that touches `localStorage`. Swapping to
  httpOnly cookies later is a one-file change.
- `authInterceptor` already attaches `Authorization: Bearer <token>` to any request
  aimed at `environment.apiBaseUrl` - inert today (no HTTP calls happen), load-bearing
  the moment a real API exists.
- `errorInterceptor` already logs out and redirects to `/login` on a `401` - so
  session-expiry handling doesn't need to be designed later, only exercised.
- `authGuard` / `guestGuard` are functional `CanActivateFn`s (not class-based guards),
  matching Angular's current recommended pattern and letting them use `inject()`.

Swapping in real JWT auth in a later sprint touches `AuthService` and
`TokenStorageService` only - guards, interceptors, and every component that calls
`authService.currentUser()` stay unchanged.

## Routing & lazy loading

Every feature is behind `loadComponent`/`loadChildren`, including the two layout shells
themselves - `main.js` only contains the app shell, router, and HTTP client. Build output
confirms the split: `dashboard-layout`, `login-layout`, `dashboard`, `coming-soon`, and
each of `doctors-routes`/`patients-routes`/`appointments-routes`/`settings-routes` are
separate chunks fetched on demand.

`doctors.routes.ts` now has five entries (`''`, `add`, `schedule`, `:id`, `:id/edit`)
instead of the single `ComingSoon` entry it shipped with in Sprint 1 - proof of the design
intent noted above: this was a diff to an existing routes file, not a rewrite. The
`schedule` entry itself `loadChildren`s a second routes file, `schedule/schedule.routes.ts`
(`''`, `leave`, `holidays`, `manage/:doctorId`) - the same lazy-loading pattern one level
deeper, so the whole Doctor Schedule sub-feature is its own chunk, not bundled into
`doctors-routes`. **Route order matters here**: `schedule` is registered before `:id`, so
`/doctors/schedule` matches the literal segment instead of being swallowed by the `:id`
parameter - a param route always needs to come last among its siblings. `patients.routes.ts`
(Sprint 4) got the identical four-entry treatment (`''`, `add`, `:id`, `:id/edit`) with no
literal sub-feature segment to order around, so it didn't need the `schedule`-style
ordering comment. `appointments.routes.ts` / `settings.routes.ts` still each export a
single-entry `Routes` array pointing at `ComingSoon`, waiting for the same treatment in
later sprints.

Breadcrumbs are generic: any route can set `data: { breadcrumb: 'Label' }` and
`buildBreadcrumbs()` (`core/utils/build-breadcrumbs.util.ts`) walks the activated route
tree collecting them - nested routes get breadcrumbs for free. `doctors.routes.ts` and
`patients.routes.ts` each set a distinct label per route (e.g. `Patients`, `Add Patient`,
`Patient Details`, `Edit Patient`) instead of the single static `title` the `ComingSoon`
placeholder used.

## Doctor Management (Sprint 2)

`features/doctors/` is the foundation Appointment Booking, Doctor Availability, AI
Scheduling, Google Calendar Sync, and WhatsApp Booking build on in later sprints, so its
service boundary was designed for that ahead of time rather than left to a rewrite:

- **`DoctorService` mixes signal-based read state with Observable-returning writes**,
  the same split `AuthService` established in Sprint 1. `doctors` (a readonly signal) and
  `doctorCount` (a computed) are the reactive source of truth - the doctor list table and
  the dashboard stat card both read `doctors`/`doctorCount` directly, so a delete on the
  list page is reflected on the dashboard without a manual refetch. `getDoctors()`,
  `getDoctor(id)`, `createDoctor()`, `updateDoctor()`, and `deleteDoctor()` all return
  `Observable`s shaped exactly like a future `HttpClient` call, and internally update the
  same signal. **Swapping the mock array for real HTTP calls only touches
  `doctor.service.ts`** - every component keeps calling the same five methods and reading
  the same two signals.
- **`pages/` vs. `components/`** follows a strict split: `pages/` holds the four routed
  screens (`doctor-list`, `doctor-add`, `doctor-edit`, `doctor-details`) that own state
  and talk to `DoctorService`; `components/` holds presentational pieces those pages
  compose (`doctor-table`, `doctor-form`, `doctor-card`, `doctor-delete-dialog`) that only
  take `input()`s and emit `output()`s. `doctor-form` is used by both `doctor-add` and
  `doctor-edit` (an optional `doctor` input pre-fills it) instead of two near-identical
  forms.
- **`doctor-table` owns sorting and pagination**; the search box and status filter live
  in `doctor-list` as page-level signal state, and the already-filtered array is passed
  down as an `input()` - the table never needs to know a filter exists.
- **Delete confirmation is a `MatDialog`** (`doctor-delete-dialog`), not a native
  `confirm()`, so it matches the app's Material 3 surface and can be tested/styled like
  any other component.

## Doctor Schedule & Availability (Sprint 3)

Builds on Sprint 2's `doctors/` feature to add weekly working hours, leave, clinic
holidays, and a slot generator - the pieces Appointment Booking and AI Scheduling need in
later sprints.

- **Two services, split by responsibility, not by entity.** `ScheduleService` is pure
  CRUD (signals + Observable methods, same shape as `DoctorService`) for three entities -
  `DoctorSchedule`, `DoctorLeave`, `ClinicHoliday`. `AvailabilityService` owns zero state
  of its own; it *derives* answers (`isDoctorAvailableOn()`, `doctorsAvailableToday`,
  `doctorsOnLeaveToday`) by reading `DoctorService` + `ScheduleService`'s signals, and
  delegates slot generation to a plain function. Neither service duplicates the other's
  job: one stores, one computes.
- **The Slot Generator is a dependency-free function**
  (`schedule/utils/generate-available-slots.util.ts`), not a service method with injected
  dependencies - it takes a schedule, a duration, existing appointments, leaves, and
  holidays as plain arguments and returns `TimeSlot[]`. `AvailabilityService.generateSlots()`
  is a one-line delegate. This matters because the *next* consumer of this exact algorithm
  (appointment booking) may not want to go through `AvailabilityService` at all - keeping
  the algorithm free of Angular DI means it's reusable wherever the four inputs are
  available, not only from within this service.
- **One weekly editor, two contexts.** `WeeklyScheduleEditor` is used both by
  `manage-schedule` (editable, `isSaving`/`save` wired up) and by Doctor Details' new
  Schedule tab (`[isReadonly]="true"`) - the exact same 7-day grid, not a second read-only
  rendering of it. `isReadonly` disables the whole `FormGroup` (`form.disable()`) rather
  than binding a redundant `[disabled]` per control, which avoids Angular's
  disabled-attribute-vs-reactive-forms warning entirely.
- **`schedule/` nests inside `doctors/`, not beside it.** The four Sprint-3 pages
  (`schedule-list`, `manage-schedule`, `doctor-leave`, `clinic-holidays`) live under
  `features/doctors/schedule/pages/` because they're a sub-capability of Doctor
  Management, not a new top-level feature - "Doctor Schedule" hangs off the Doctors item
  in the sidenav for the same reason. The new models (`doctor-schedule.model.ts`,
  `doctor-leave.model.ts`, `clinic-holiday.model.ts`, `time-slot.model.ts`) and services
  stay flat in the existing `doctors/models/` and `doctors/services/` folders alongside
  `doctor.model.ts`/`doctor.service.ts`, rather than nesting under `schedule/` too -
  they're doctor-domain concepts a future feature (patients, appointments) could just as
  plausibly need, so they sit at the same level `Doctor` does.
- **`schedule-nav`** is a small pill-tab component shared by the three sibling list
  screens (Schedule List / Doctor Leave / Clinic Holidays) - `manage-schedule` doesn't
  include it, the same way `doctor-edit` doesn't show `doctor-list`'s filters, because
  it's a focused single-doctor edit view, not a sibling list.
- **Leave/holiday create and edit happen in a dialog, not a routed page** - `LeaveForm`
  and `HolidayForm` are opened directly via `MatDialog.open(LeaveForm, ...)`, the same
  self-contained-dialog-component shape `DoctorDeleteDialog` already used, rather than
  adding `leave/add` and `holidays/add` routes nobody asked for.
- **Nested sidenav entry.** `NavItem` gained optional `children`/`exactMatch` fields so
  "Doctors" can group "Doctor List" and "Doctor Schedule" without an accordion/expand-
  collapse state machine - since there's exactly one such group today, a permanently
  visible child list under a non-clickable group label is simpler than building
  expand/collapse for a single case (see `CodingStandards.md`: don't build for
  hypothetical futures).

## Patient Management (Sprint 4)

`features/patients/` replaces the `ComingSoon` placeholder Sprints 1-3 left in place,
copying the `doctors/` feature shape deliberately rather than inventing a new one - by the
third feature (`auth` -> `doctors` -> `patients`) built against the same service/component
split, following it isn't a style choice anymore, it's the path of least resistance.

- **`PatientService` is `DoctorService` with a different entity.** Same signal-plus-
  Observable split (`patients` readonly signal, `patientCount` computed, five
  Observable-returning CRUD methods seeded from a mock array), so the dashboard's
  Patients card and the patient list both read live state without a manual refetch, and
  the eventual `HttpClient` swap only touches `patient.service.ts`.
- **`pages/` vs. `components/`** follows the same split as `doctors/`: `patient-list`,
  `patient-add`, `patient-edit`, `patient-details` own state and talk to `PatientService`;
  `patient-table` and `patient-form` are presentational, reused across add/edit exactly
  the way `doctor-form` is. `patient-table` owns sorting and pagination (including a
  custom `sortingDataAccessor` so the derived, non-stored `Age` column and the composed
  `Name` column sort correctly) while search/status filtering stay page-level state in
  `patient-list`, mirroring `doctor-table`.
- **No `patient-delete-dialog`.** By Sprint 4, `ConfirmDialog` (promoted to `shared/` in
  Sprint 3) already had three consumers; `patient-list`'s delete flow opens it directly
  instead of adding a fourth near-identical dialog component - the abstraction earned its
  keep before Patients needed it.
- **Age is calculated, never stored.** `Patient` has `dateOfBirth` but no `age` field;
  `calculateAge()` (`patients/utils/patient-age.util.ts`) is a pure, dependency-free
  function (same shape as `schedule/utils/schedule-date.util.ts`) called wherever an age
  needs displaying (`patient-table`'s Age column, `patient-details`' Personal Information
  card) or sorting. Storing a derived value that goes stale the day after every birthday
  would be the bug, not the fix.
- **Emergency contact is a nested `FormGroup`, not three flat fields.** `PatientForm`
  builds `emergencyContact` as a child group (`formGroupName="emergencyContact"`) mirroring
  the `EmergencyContact` interface directly, so the form's shape and the model's shape
  never drift apart the way three independently-named flat controls could.
- **Patient Details is Material Cards inside a `mat-tab-group`,** not a single scrolling
  page: an "Overview" tab holds four cards (Personal Information, Contact, Medical
  Information, Notes) matching the requirement's sections one-to-one, plus "Future
  Appointments" and "Conversation History" tabs that are inline placeholder markup (not a
  routed `ComingSoon` instance, since there's no route to point it at yet) - they'll gain
  real content once Appointments and WhatsApp messaging exist, without changing this
  page's tab structure.
- **Dashboard's Patients card is live**, replacing the Sprint 1 hardcoded `248` with
  `patientService.patientCount()`, the same integration point Sprint 3 used for the two
  doctor-availability cards. The "Add Patient" quick action now navigates to
  `/patients/add` instead of showing a "coming soon" snackbar, matching "Add Doctor"'s
  existing behavior.

## Theming: Material 3, not hand-picked hex values

`src/theme/theme-colors.scss` was generated by Angular Material's own
`ng generate @angular/material:theme-color` schematic from the brand's primary
(`#2563EB`), secondary (`#0F172A`), and error (`#EF4444`) colors - it is **not**
hand-written. This produces real M3 tonal palettes (13 lightness stops per color role)
so every Angular Material component (buttons, form fields, menus) automatically respects
the brand without per-component style overrides. `styles.scss` feeds those palettes into
`mat.theme()`, which emits the `--mat-sys-*` CSS custom properties every component reads.

M3 doesn't define "success"/"warning" roles, so those two semantic colors are exposed as
plain custom properties (`--kapis-color-success`, `--kapis-color-warning`) alongside the
Material system tokens, set once in `styles.scss`.

## HTTP interceptor chain

Registered in `app.config.ts` via `provideHttpClient(withInterceptors([...]))` in this
order: `authInterceptor` -> `loadingInterceptor` -> `errorInterceptor`. Order matters:
auth attaches the header before the request leaves; loading brackets the entire
request/response cycle; error handling runs last so it sees the final response/error.

## Database: schema-per-product

`database/schema/001_init_schemas.sql` creates two Postgres schemas: `n8n` (n8n's own
internal tables) and `clinic` (Kapis Clinic AI's product tables). A second product on
this platform gets its own schema instead of prefixing every table name - this is the
"every decision should support future SaaS expansion" instruction applied to the data
layer.

Postgres only auto-runs **top-level** files placed in `docker-entrypoint-initdb.d`
(no subfolders), which is why `docker-compose.yml` mounts `database/schema` directly
to that path rather than nesting it - a subfolder mount would silently no-op.

`database/migrations/002_create_doctors.sql` is the first table in `clinic`:
`clinic.doctors`, keyed by a `uuid` primary key (`gen_random_uuid()`, built into Postgres
core since v13 - no `pgcrypto` extension needed) so the mock service's
`crypto.randomUUID()` ids and the eventual database ids are the same shape and format.
It's a **migration**, not part of `schema/`, and is applied manually (see
`docs/DevelopmentGuide.md`) rather than auto-run - none of the Sprint 2/3 migrations are
wired up yet since the app still runs on mock data. Indexes cover the three things the
doctor list actually filters/sorts by (`last_name`, `specialization`, `status`);
`registration_number` and `email` are unique constraints, matching the mock service's
assumption that both identify a doctor uniquely.

Sprint 3 adds three more, each mirroring a `ScheduleService`/`AvailabilityService` mock
entity exactly:

- `003_create_doctor_schedules.sql` - `clinic.doctor_schedules`, **one row per
  (doctor, day-of-week)** rather than a JSON blob per doctor, so "which doctors work
  Mondays" is a plain indexed query instead of a JSON traversal - the same query the Slot
  Generator and the "Doctors Available Today" card both need. Composite primary key
  `(doctor_id, day_of_week)`.
- `004_create_doctor_leaves.sql` - `clinic.doctor_leaves`, one row per leave period,
  indexed on `(doctor_id, start_date, end_date)` for the range lookup
  `isDoctorOnLeave()` performs.
- `005_create_clinic_holidays.sql` - `clinic.clinic_holidays`, clinic-wide (no
  `doctor_id`) since a holiday zeroes out availability for every doctor, not one;
  `recurring_yearly` is a flag the *application* interprets (month/day match across
  years) rather than something the schema enforces.

All three reuse the `clinic.set_updated_at()` trigger function `002_create_doctors.sql`
defines, rather than redefining it.

Sprint 4 adds `006_create_patients.sql` - `clinic.patients`, mirroring `PatientService`'s
mock shape field-for-field. `EmergencyContact` is flattened into three prefixed columns
(`emergency_contact_name`/`_relationship`/`_phone`) rather than a child table, since a
patient has exactly one emergency contact today - a `clinic.patient_contacts` table can be
added later without touching this one if that changes. `date_of_birth` is a `date` with a
`CHECK (date_of_birth <= CURRENT_DATE)` constraint (matching `PatientForm`'s
not-in-the-future validator); there is deliberately no `age` column, since age is
calculated in the application layer and storing it would go stale. Indexes cover
`last_name` (list search), `mobile_number`/`whatsapp_number` (future WhatsApp inbound
message matching), and `status` (list filter) - no uniqueness constraint on
`mobile_number`/`email`, since family members can plausibly share a contact number.
Reuses `clinic.set_updated_at()` the same way `003`-`005` do.

## Docker services

| Service    | Why it exists here |
| ---------- | ------------------- |
| `postgres` | Single source of truth for both the Angular app's future API and n8n's internal state - one instance, two schemas, to keep local setup to one container instead of two. |
| `pgadmin`  | Inspecting/debugging data without leaving the browser or hand-rolling `psql` commands. |
| `n8n`      | Where WhatsApp/AI/Calendar orchestration is built in later sprints - kept as its own service (not code inside the Angular app) because workflow automation and a request/response admin UI have fundamentally different execution models. |

Container/network/volume names are prefixed `kapis-clinic-*` (not the shorter
`kapis-*`) specifically so this stack can run alongside other local Postgres/n8n
instances without name or port collisions - verified against another already-running
project on this machine during Sprint 1 setup.

## What's deliberately not here yet

No WhatsApp integration, no Claude/OpenAI calls, no Google Calendar, no real JWT backend.
Sprint 2 added the Doctors feature; Sprint 3 added Doctor Schedule, Leave, Clinic
Holidays, and a slot generator; Sprint 4 added Patient Management - all still mock data,
with `clinic.doctors`, `clinic.doctor_schedules`, `clinic.doctor_leaves`,
`clinic.clinic_holidays`, and `clinic.patients` sitting unconnected in migrations for when
a real API layer exists (see "Doctor Management", "Doctor Schedule & Availability", and
"Patient Management" above). Appointments and Settings are still "Coming Soon"
placeholders, and there's no appointment-booking UI yet - the Slot Generator computes
availability but nothing calls it to actually book something, and Patient Details'
"Future Appointments"/"Conversation History" tabs are still inline placeholders. The
architecture exists so each of those is additive work in a predictable place, not a
redesign.
