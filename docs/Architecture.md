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
  `NotFound`, `ComingSoon`, `Breadcrumb`, `ConfirmDialog`. `ComingSoon` now serves no
  active nav item as of Sprint 6 (every top-level feature is built out) but stays in
  `shared/` as the pattern for whatever the next feature area is. `ConfirmDialog`
  (Sprint 3) was promoted here from a doctors-only `DoctorDeleteDialog` once Doctor Leave
  and Clinic Holiday delete needed the identical yes/no dialog shell - a second and third
  consumer is exactly the point at which `CodingStandards.md`'s "add the abstraction when
  it's needed" rule fires. Patient delete (Sprint 4) was its fourth consumer, Appointment
  cancel (Sprint 5) its fifth, User delete (Sprint 6) its sixth, Services/Policies/
  Insurance Providers/Message Templates delete (Sprint 7) its seventh through tenth, and
  Webhook delete (Sprint 8) its eleventh, and none of `patients/`, `appointments/`,
  `settings/`, `knowledge-base/`, or `integrations/` has its own delete/cancel dialog
  component as a result - `doctor-delete-dialog` predates the promotion and was left
  as-is rather than churned into a `ConfirmDialog` call for a working, untouched Sprint 2
  file.
- **`layout/`** - page *shells*, not page content: `DashboardLayout` (toolbar + sidenav +
  breadcrumb + `<router-outlet>`) and `LoginLayout` (centered, unauthenticated). Feature
  routes render *inside* these shells; the shells never know what feature is active.
- **`features/`** - one folder per business capability (`auth`, `dashboard`, `doctors`,
  `patients`, `appointments`, `settings`, `knowledge-base`, `integrations`,
  `conversations`). Each is
  lazy-loaded independently. Feature-only
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
  justification. Sprint 5's `appointments/` keeps the same `pages/`/`components/` split
  but, unlike `patients/`, actively reuses another feature's services rather than just
  copying its shape - see "The Appointment Engine" below. Sprint 6's `settings/` is the
  first feature with more than one service (`ClinicService`, `SettingsService`,
  `UserService`, split by what they own rather than by page) and the first to import a
  `core/` model (`UserRole`) into a feature model instead of duplicating it - see "Clinic
  Administration & Configuration" below. Sprint 7's `knowledge-base/` goes back to a
  single service (`KnowledgeBaseService`) covering all seven of its entities, and is the
  first feature to read (not import a type from) another feature's service directly in a
  page component - `DoctorProfiles` joins `DoctorService.doctors()` with its own
  extension data rather than either service knowing about the other - see "Knowledge
  Base" below. Sprint 8's `integrations/` returns to the single-service shape
  (`IntegrationService`) and introduces this codebase's first entirely mocked *action*
  (not just mocked CRUD) - `test*Connection()` - see "Integration Layer" below. Sprint 9's
  `conversations/` goes back to a `pages/`/`components/` split like `doctors/`/`patients/`,
  but with only two routed pages (`inbox`, `conversation-details`) and six presentational
  components rather than a page-per-entity - the entities here (messages, notes, tags,
  an AI draft, an assignment control) are all sub-parts of one conversation, not siblings
  in a list the way Knowledge Base's seven entities were - see "Conversation Center"
  below.

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
each of `doctors-routes`/`patients-routes`/`appointments-routes`/`settings-routes`/
`knowledge-base-routes`/`integrations-routes`/`conversations-routes` are separate chunks
fetched on demand.

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
ordering comment. `appointments.routes.ts` (Sprint 5) has six entries - `''`, `book`,
`calendar`, `daily-schedule`, `:id`, `:id/edit` - and does need the ordering comment again,
since `book`/`calendar`/`daily-schedule` are literal segments that must be registered
before `:id` for the same reason `schedule` does. `settings.routes.ts` (Sprint 6) has
eight flat entries (`''`, `business-hours`, `appointment-settings`, `users`,
`roles-permissions`, `ai-settings`, `whatsapp-settings`, `notification-settings`) with no
`:param` route among them at all, so - unlike `doctors`/`appointments` - there's no
ordering constraint to document; every settings sub-page includes `<app-settings-nav />`
directly in its own template rather than the routes file needing a wrapping shell route,
the same flat-pages-share-a-nav-component shape `schedule/schedule.routes.ts` established
in Sprint 3. `knowledge-base.routes.ts` (Sprint 7) repeats that exact shape - seven flat
entries (`''`, `faqs`, `doctor-profiles`, `policies`, `insurance-providers`,
`message-templates`, `ai-prompt-settings`), no `:param` route, `<app-knowledge-base-nav />`
in every page template. `integrations.routes.ts` (Sprint 8) repeats it again - five flat
entries (`''`, `whatsapp`, `claude`, `google-calendar`, `webhooks`), no `:param` route,
`<app-integrations-nav />` in every page template. By the third feature in a row using
this exact flat-routes-plus-shared-sub-nav shape, it's the default for any feature whose
pages are siblings rather than a hierarchy, not a one-off worth reconsidering per sprint.
`conversations.routes.ts` (Sprint 9) breaks that streak on purpose: it has only two
entries (`''` for the Inbox, `:id` for Conversation Details), so there is no sibling-page
sub-nav to share and no ordering concern (`:id` has no literal segment to lose to).

The sidenav also grew a fifth nested group in Sprint 8: `nav-items.constant.ts`'s
`Integrations` entry has `children` (all five sub-pages), the same shape `Doctors`,
`Appointments`, `Settings`, and `Knowledge Base` already used. Sprint 9's `Conversations`
entry is deliberately **flat**, not nested, the same as `Patients` - with only an Inbox
and a param-route Details page, there is no sibling list of sub-pages to group under an
expandable parent.

Breadcrumbs are generic: any route can set `data: { breadcrumb: 'Label' }` and
`buildBreadcrumbs()` (`core/utils/build-breadcrumbs.util.ts`) walks the activated route
tree collecting them - nested routes get breadcrumbs for free. `doctors.routes.ts`,
`patients.routes.ts`, `appointments.routes.ts`, `settings.routes.ts`,
`knowledge-base.routes.ts`, `integrations.routes.ts`, and `conversations.routes.ts` each
set a distinct label per route (e.g. `Patients`, `Add Patient`, `Patient Details`, `Edit
Patient`) instead of the single static `title` the `ComingSoon` placeholder used.

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

## The Appointment Engine (Sprint 5)

`features/appointments/` is "the core scheduling engine for the platform" per the
Sprint 5 brief, which means its defining property isn't its own code - it's how little
new logic it contains. Doctor availability, leave, holidays, and slot generation already
existed (Sprint 3); active/inactive patients and doctors already existed (Sprint 2/4).
Appointments' job is to compose those into a booking flow and a set of booking-rule
guarantees, not re-derive any of them:

- **`AppointmentService` reuses `DoctorService`, `PatientService`, and
  `AvailabilityService` directly** rather than duplicating doctor/patient/availability
  logic. Its own `_appointments` signal is genuinely new state (Sprint 3/4 had nothing to
  book against yet); everything else it does is composition.
- **Booking rules are enforced in one function, `validateBooking()`**, called from both
  `createAppointment()` and `updateAppointment()`: doctor must be active, patient must be
  active, doctor must be available that day (working hours, minus leave, minus clinic
  holidays - all three already handled by `AvailabilityService.isDoctorAvailableOn()`),
  and the new/edited time range must not overlap another non-cancelled appointment for
  that doctor (`doTimeRangesOverlap()`, a pure function in
  `appointments/utils/appointment-time.util.ts` built on the existing
  `timeToMinutes()` from the Sprint 3 schedule utils). This is enforced defensively at
  the service layer, not just by only offering valid slots in the UI - a stale slot list
  or a second browser tab can't create a double-booking.
- **`AvailabilityService` grew one new method, `getAvailableSlots(doctorId, date,
  existingAppointments)`**, instead of `AppointmentService` re-injecting
  `ScheduleService` to assemble a `SlotGeneratorInput` itself. `AvailabilityService`
  already injects `ScheduleService`; teaching it to resolve "this doctor's schedule +
  leaves + holidays, then generate slots" keeps that composition in the one service that
  already owns it. `AppointmentService.getAvailableSlots()` is a thin wrapper that adds
  "existing appointments" (its own state, filtered to this doctor/date, minus cancelled,
  minus the appointment being edited) - the two-line docstring on
  `AvailabilityService.generateSlots()` from Sprint 3 explicitly anticipated this reuse.
- **Slot availability updates immediately after booking without any explicit refresh
  logic**, because `getAvailableSlots()` is a plain synchronous method that reads
  `_appointments()` (a signal) - calling it inside a `computed()`, as `AppointmentBook`
  and `AppointmentEdit` both do, means Angular's dependency tracking picks up that read
  automatically. Booking an appointment updates the signal; every `computed()` reading
  slots for that doctor/date recomputes on the next read. No event bus, no manual
  `refetch()` call.
- **The booking wizard (`appointment-book`) is a `mat-stepper` driven by signals, not a
  multi-step `FormGroup`.** Each step is a single selection (patient, doctor, date +
  slot, confirm), so there's no per-field validation to wire up - a `computed()` per step
  tracks whether a selection exists, and `linear` mode uses that to gate "Next".
  `AppointmentEdit` (reschedule) reuses the same `SlotPicker` component and the same
  `getAvailableSlots()` call, passing its own id as `excludeAppointmentId` so its current
  slot doesn't appear unavailable against itself.
- **Two different "day" views serve two different jobs, deliberately not merged.**
  Calendar View's Day tab (one of three modes alongside Month/Week, switched via
  `mat-button-toggle-group` rather than three routes, since none needs its own URL) lists
  every doctor's appointments for one day - a receptionist's "what's happening today"
  view. Daily Schedule is scoped to one selected doctor and shows every slot in their
  working day, free or booked, by calling `AvailabilityService.getAvailableSlots()`
  directly with an empty booked-list (giving every possible slot, ignoring bookings) and
  cross-referencing `AppointmentService`'s appointments to mark each Free/Booked - a
  front-desk day-sheet for handing a doctor their schedule. Reusing one component for
  both would have meant awkward mode-switching props instead of two small, single-purpose
  pages.
- **`Appointment.durationMinutes` is snapshotted at booking time**, not derived from
  `startTime`/`endTime` on every read - mirroring why `Patient` doesn't store `age`. The
  difference: `durationMinutes` genuinely needs snapshotting (a doctor's
  `consultationDuration` can change after the appointment was booked; the appointment
  should keep the duration it was actually booked for), whereas age recomputes cleanly
  from a fixed birth date with no such "what was true at booking time" concern.
- **Dashboard integration**: the old hardcoded `"Today's Appointments": 12` card is now
  `appointmentService.todaysAppointmentCount()`, and three new live cards join it -
  `Upcoming Appointments`, `Cancelled Today`, `Completed Today` - each a `computed()` on
  `AppointmentService`. The "New Appointment" quick action now navigates to
  `/appointments/book` instead of showing a "coming soon" snackbar.

## Clinic Administration & Configuration (Sprint 6)

`features/settings/` replaces the `ComingSoon` placeholder Settings had held onto since
Sprint 1. The brief frames it as "the central configuration for Kapis Health AI... used
by future AI, WhatsApp, Google Calendar and Notification modules" - so the design
question wasn't "how do I build eight forms," it was "what read surface does a module
that doesn't exist yet need." That framing drove every decision below.

- **Three services, split by ownership, not by page count.** `ClinicService` owns the
  clinic's own identity (`ClinicProfile`, `BusinessHours`) - the "who and where and when
  are we" questions. `SettingsService` owns the four *operational* configuration groups
  that aren't identity or user management (Appointment Settings, AI Settings, WhatsApp
  Settings, Notification Settings). `UserService` owns both User Management and Roles &
  Permissions, because a permission is meaningless without the role vocabulary users are
  assigned from - splitting those into two services would just mean two services always
  read together. All three follow the same signal-plus-Observable shape every service
  since `DoctorService` has used; the singleton-config entities (everything except
  `ClinicUser`) get a get/update pair rather than full CRUD, the shape
  `ScheduleService.getSchedule()`/`updateSchedule()` set for a per-doctor singleton in
  Sprint 3.
- **`UserRole` is imported from `core/models/user.model.ts`, not redefined.** Every prior
  feature-local type decision in this codebase (`Gender` duplicated in `patients/`
  rather than imported from `doctors/`, `BusinessDayOfWeek`... see below) leaned toward
  duplicating trivial unions to avoid cross-feature coupling. `UserRole` breaks that
  pattern deliberately: `core.User` (Sprint 1's dummy auth session shape) and
  `ClinicUser` (this sprint's managed-user record) are the same real-world concept, not a
  coincidence of naming - the day a real JWT backend arrives, logging in as a
  `ClinicUser` is the actual intended behavior, not a future migration. Reusing the type
  now means that link doesn't need inventing later.
- **`BusinessDayHours` imports `DayOfWeek` from `doctors/models/doctor-schedule.model.ts`
  cross-feature**, following the precedent Sprint 5 already set (`appointments/` reusing
  `DayOfWeek`, `getDayOfWeek`, `timeToMinutes`, `toIsoDate` from the same file) rather
  than Sprint 4's precedent (`patients/` duplicating `Gender` locally). The distinguishing
  factor both times: `DayOfWeek` and the schedule utils are pure, dependency-free, and
  explicitly designed for reuse (their own doc comments say so); `Gender` was a
  three-value domain type with no such intent. `ClinicService.isOpenNow` reuses
  `timeToMinutes()`/`getDayOfWeek()` the same way for exactly this reason.
- **The reusable permission model**: `RolePermission` (`settings/models/permission.model.ts`)
  is one row per `(role, module)`, each carrying `{ view, create, update, delete }` -
  the `doctor_schedules` "one row per (entity, category)" shape from Sprint 3, applied to
  a role x module grid instead of a weekly grid. `PermissionModule` is the closed
  nine-value union the brief specified. `RolesPermissions` (the page) selects a role via
  `mat-button-toggle-group` and renders its 9-row matrix through a presentational
  `PermissionMatrix` component that only knows `RolePermission[]` in, toggle events out -
  it has no idea `UserService` exists. **No authentication changes**: nothing here is
  consulted by `authGuard` or `authInterceptor` - this is a configuration surface, not
  enforcement, exactly as scoped.
- **AI Settings and WhatsApp Settings are placeholder-only, and the code says so.**
  `SettingsService.updateAiSettings()`/`updateWhatsAppSettings()` persist whatever's
  typed into `claudeApiKey`/`accessToken`/`webhookUrl`/etc. into the signal and nothing
  else - no `HttpClient` call, no `fetch`, no webhook listener is wired up. Enabling
  either toggle today only flips a boolean in memory. This is the intentional stopping
  point: Sprint 6 builds the configuration surface those future modules will read from
  (`SettingsService.aiSettings()`/`.whatsappSettings()` are exactly the shape a future
  `AiService`/`WhatsAppService` would inject), not the integrations themselves.
- **Business Hours reuses the `WeeklyScheduleEditor` *shape*, not the component.**
  `BusinessHoursEditor` is a new component with the same "one `FormGroup` per
  day-of-week in a `FormArray`" structure Sprint 3's `WeeklyScheduleEditor` established,
  but its fields differ (a single open/close window plus a lunch break, not two
  doctor-consultation windows) - bending `WeeklyScheduleEditor`'s form shape to fit a
  different domain would have coupled two unrelated concepts for a superficial line-count
  saving.
- **User Management reuses the `LeaveForm`/`HolidayForm` dialog-CRUD shape**, not the
  routed-pages shape `doctors/`/`patients/` use: `UserForm` is a self-contained
  `MatDialog` opened directly from `UserManagement`, matching Sprint 3's leave/holiday
  dialogs rather than Sprint 2/4's add/edit routed pages - a five-field entity with no
  detail view doesn't need two dedicated routes.
- **Dashboard integration**: a new `clinic-banner` card (Clinic Name, Time Zone, an
  Open/Closed chip driven by `ClinicService.isOpenNow`) sits above the existing
  summary-card grid rather than being forced into the `SummaryCard` shape - `SummaryCard`
  is `{ label, value: number, icon, accentVar }`, and "Clinic Name" is a string, not a
  number, so reusing that shape would have meant lying about the data type instead of
  adding a second, honestly-different card shape for a second kind of information.

## Knowledge Base (Sprint 7)

`features/knowledge-base/` replaces the `ComingSoon` placeholder Knowledge Base had held
onto since Sprint 1. The brief frames it as content that "will power future AI
conversations" - so, like Sprint 6, the design question was "what does a future
`AiService` read from" rather than "how do I build seven CRUD screens."

- **One service, not three.** `KnowledgeBaseService` covers all seven entities (Services,
  FAQs, Doctor Profile extensions, Policies, Insurance Providers, and Message Templates
  get full signal-plus-Observable CRUD; AI Prompt Settings gets a get/update pair). This
  is a deliberate reversal of Sprint 6's ownership-split precedent: none of these seven
  entities has enough independent lifecycle to justify separate services yet - they're
  all "content the AI reads," not distinct operational domains the way Clinic Identity,
  Appointment Policy, and User/Role management were. If any one of them grows its own
  complex workflow later, it can be split out the same way Settings' three services
  already show how to do.
- **Doctor Profiles extends `DoctorService`'s doctors without duplicating them.**
  `DoctorProfileExtension` never stores name, specialization, fee, or any field `Doctor`
  already owns - only a `doctorId` foreign key plus AI/patient-facing content
  (biography, languages, awards, certifications, publications, interests, video URL,
  display priority). The `DoctorProfiles` page is the first place in this codebase where
  a page component reads two different features' services directly and joins their data
  itself (`computed(() => doctorService.doctors().map(doctor => ({ doctor, extension:
  ... }))`)), rather than one service reusing another service's *logic* the way
  `AppointmentService` reuses `AvailabilityService`, or one feature importing another
  feature's *type* the way Settings reuses `DayOfWeek`. `DoctorProfileForm` shows the
  doctor's name read-only (sourced from the `Doctor` passed into the dialog) and writes
  only extension fields via `KnowledgeBaseService.saveDoctorProfileExtension()` - a single
  upsert-shaped call, so the page never has to branch on "does this doctor already have a
  profile."
- **Six of the seven pages are dialog-CRUD**, not routed add/edit pages - `ServiceForm`,
  `FaqForm`, `PolicyForm`, `InsuranceProviderForm`, `MessageTemplateForm`, and
  `DoctorProfileForm` all follow Sprint 6's `UserForm` shape (`MatDialog.open(...)`
  called directly from the list page). None of the seven entities has a detail view, so
  a second route per entity would add navigation with nothing to show - the same
  reasoning Sprint 6 used for User Management.
- **`MessageTemplate.variables` and `DoctorProfileExtension`'s five list fields
  (languages, awards, certifications, publications, interests) are all edited as
  comma-separated text, not a chip editor.** Each is a flat, order-independent list of
  short strings with no per-item attributes - building or importing a chip-input
  component for that would be solving a problem the field doesn't have. If a future
  sprint needs per-item structure (e.g. an award with a year and issuing body), that's
  the point to reconsider, not before.
- **AI Prompt Settings is placeholder-only, distinct from Sprint 6's AI Settings.**
  `settings/models/ai-settings.model.ts` (Sprint 6) holds *provider* config - which AI
  (`claude`/`openai`), API keys, model, temperature. `knowledge-base/models/
  ai-prompt-settings.model.ts` (Sprint 7) holds *persona* config - clinic personality,
  tone, greeting, fallback message, emergency instructions, escalation rules, system
  prompt. They're deliberately two different models rather than one growing form,
  because a future `AiService` needs both but they change independently (swapping AI
  providers shouldn't touch the clinic's greeting copy, and rewriting the greeting
  shouldn't touch API keys) - the same "split by what changes together" reasoning
  Sprint 6 used to separate its three services.
- **Dashboard integration**: three more live cards - `KnowledgeBaseService
  .serviceCount()`, `.faqCount()`, `.templateCount()` - joining the Sprint 5/6 cards in
  the same `computed<SummaryCard[]>()`.

## Integration Layer (Sprint 8)

`features/integrations/` replaces the `ComingSoon` placeholder Integrations had held
onto since Sprint 1. The brief is explicit: "No AI calls. No WhatsApp messages. No
Google API calls. Only architecture and configuration." So every design decision below
answers "how do we shape the configuration surface and its mocked verification step"
rather than "how do we call these APIs" - the latter is intentionally still not this
sprint's job.

- **One service, `IntegrationService`, covers all four integrations** - the same
  single-service shape Sprint 7's `KnowledgeBaseService` used, for the same reason:
  WhatsApp, Claude, Google Calendar, and Webhooks don't yet have enough independent
  lifecycle to justify separate services. If one of them later grows real API
  integration work (retry logic, rate limiting, OAuth token refresh), that is a natural
  point to split it out on its own, the way Settings' three services already demonstrate
  how to do.
- **"Test Connection" is this codebase's first entirely mocked *action*, not just mocked
  CRUD.** Every prior sprint's mock methods stand in for a future `HttpClient` read or
  write of this app's own data. `testWhatsAppConnection()`/`testClaudeConnection()`/
  `testGoogleCalendarConnection()` stand in for something categorically different: an
  outbound call to a third party. The shape is identical on purpose
  (`Observable`, `delay()`, then a `tap()` that updates state) specifically so that
  swapping in a real implementation later is additive - the button, the loading state,
  and the snackbar message never need to change, only what's inside the service method.
- **`status` and `enabled` are two different concepts, deliberately not merged into
  one.** `enabled` (present on Claude and Google Calendar, per the brief's field list) is
  a user-controlled toggle - "turn this integration on." `status`
  (`connected`/`disconnected`/`error`, present on all three) is read-only application
  state that only a Test Connection call changes; no form in this feature ever lets a
  user directly set `status` to `'connected'`, because that would mean the UI can lie
  about a connection that was never actually verified (even a mock one). WhatsApp has no
  `enabled` field at all, matching the brief's field list exactly - its `status` alone
  carries "is this on and working."
- **`IntegrationStatusChip` is one shared presentational component, used in three
  different contexts**: each provider's own config page, all four Integrations Dashboard
  cards, and the main Dashboard's new integration health row. One place defines what
  `connected`/`disconnected`/`error` look like; none of the three consumers has its own
  copy of that color logic.
- **Webhooks is the only entity here with full CRUD**, reusing Sprint 7's dialog-CRUD
  shape (`WebhookForm` via `MatDialog.open(...)`, matching `ServiceForm`/`UserForm`) -
  the other three integrations are singleton configuration, not a list of records, so
  they get a form + status chip instead of a table. Its `events` field is a fixed-
  vocabulary `mat-select multiple` over `WEBHOOK_EVENTS`, a deliberate departure from
  Sprint 7's `MessageTemplate.variables` comma-separated free text: webhook events are
  real system event names a future dispatcher will pattern-match against, so typos need
  to be structurally impossible, not just easy to notice and fix.
- **The Integrations Dashboard and the main Dashboard's health row read the same
  signals, not a duplicated summary.** Both inject `IntegrationService` directly and
  read `.whatsapp()`/`.claude()`/`.googleCalendar()`/`.activeWebhookCount()`/
  `.webhookCount()` - there is no intermediate "integration summary" model to keep in
  sync, the same reasoning that keeps the Sprint 6 clinic banner reading
  `ClinicService.isOpenNow` directly rather than through a derived dashboard-only signal.
- **Webhooks' dashboard/overview presence is count-based, not status-based, and the code
  says why.** WhatsApp/Claude/Google Calendar each have exactly one connection to be
  connected or not; Webhooks is a list, so forcing it into the same
  `IntegrationStatusChip` would mean inventing a fake single "webhooks status" out of N
  independent records. Its card shows `{activeWebhookCount} / {webhookCount} Active`
  instead - an honest representation of what's actually true, the same reasoning that
  kept the Sprint 6 clinic banner out of the numeric `SummaryCard` shape.

## Conversation Center (Sprint 9)

`features/conversations/` replaces the `Conversations` `ComingSoon` placeholder. Unlike
every other sprint that started from a placeholder, this one had no existing route/nav
entry to replace - Sprint 8's brief never wired one up, so Sprint 9 adds the route
segment, nav item, and feature folder from scratch rather than swapping a
`loadComponent` target.

- **Three services, split the way the brief named them, not by convenience.**
  `ConversationService` owns conversations (status, tags) and internal notes -
  mirroring `KnowledgeBaseService`'s reasoning, notes and tags have no independent
  lifecycle from the conversation they belong to, so splitting them out would just mean
  two services always read together. `MessageService` owns the message timeline,
  unread counts, and sending replies. `ConversationAssignmentService` owns assignment as
  **append-only history**, not a mutable pointer alone - "who was assigned when" needs
  to survive reassignment, which only a history table (not just overwriting
  `assignedToUserId`) can answer. `Conversation.assignedToUserId` still exists as a
  denormalized "who owns this today" pointer for cheap list-view reads, kept in sync by
  `ConversationService.setAssignedUser()` - a **synchronous** mutator, not
  Observable-returning like the rest of the service. An earlier version returned an
  Observable there and `ConversationAssignmentService.assign()` `.subscribe()`d to it
  from inside its own `delay(300)` tap; that composed two independently-delayed
  Observables and made the UI lag the "assigned" confirmation toast by up to 2x the
  intended delay - caught during browser verification, fixed by making the cross-service
  call synchronous so both updates land in the same tick.
- **Conversation Details reads live signals via `computed()`, not a one-shot
  `toSignal(getX(id))` snapshot**, unlike Patient/Appointment Details. Sending a reply,
  changing status, assigning, tagging, and adding a note all need to show up immediately
  without navigating away and back - `toSignal` over a `of(...).pipe(delay(300))`
  Observable only captures one emission, so none of those in-place actions would have
  refreshed the page without an explicit re-navigate. Reading `conversationService
  .conversations()`/`messageService.messages()` directly inside `computed()` (the same
  "sync method called from inside a computed" idiom `AppointmentService.getPatientName()`
  established) means every mutation - from this page or, in principle, anywhere else -
  is reflected on the next signal read, no manual refetch.
- **The inbox quick-filter vocabulary is deliberately not `ConversationStatus`.** The
  brief lists both a 4-value `ConversationStatus` (Open/Waiting/AI Pending/Closed) and a
  4-value Filters list (Open/Assigned/AI Pending/Closed) that don't match - "Assigned" is
  not a status. `ConversationQuickFilter` is its own type: `open`/`ai_pending`/`closed`
  filter on the matching status, `assigned` filters on `assignedToUserId !== null` (a
  cross-status condition), and `waiting` conversations are only visible under `all`. This
  is a real vocabulary mismatch in the brief, not a modeling mistake - resolving it as
  two separate types rather than forcing one union to serve both jobs keeps each
  correct for what it actually filters.
- **`ConversationList` (the inbox row) uses plain flex markup, not `mat-list-item` +
  `matListItemTitle`/`matListItemLine`.** Discovered during browser verification:
  Material's list directives size each row from a fixed line-count grid, which
  overlapped the name/preview/meta rows once a status chip and assignee line were added
  as a third line. Dropping to a custom `<div>`-based row (still inside a container
  styled to look like a list) traded Material's built-in ripple/line-grid for full
  control over a genuinely custom three-line row shape.
- **The AI Draft Panel is entirely local, mock-only state - no service, no HTTP, no
  Claude API call.** "Generate"/"Regenerate" pick the next of three canned templates
  (interpolating the last patient message for the illusion of context) and simulate
  latency with `of(...).pipe(delay(900))`, the same async-mock idiom every service in
  this app uses for consistency, even though there is no service backing it. It does not
  read `IntegrationService`'s (also mock) Claude config or `AIPromptSettings` from
  Knowledge Base - wiring a real provider, or even reading those settings, is explicitly
  out of scope per "No AI API calls."
- **Internal Notes and Tags live on `ConversationService`, not their own services.**
  The brief names exactly three services (`ConversationService`, `MessageService`,
  `ConversationAssignmentService`) - notes and tags are conversation metadata with CRUD
  needs but no independent lifecycle, so they got methods on the one service that already
  owns the conversation, the same call `KnowledgeBaseService` made for its seven
  entities in Sprint 7 rather than one service per entity.
- **Appointment Summary and Assigned Doctor are computed joins, not stored fields.**
  Conversation Details reads `AppointmentService`/`DoctorService`/`UserService`
  directly and joins by `patientId`/`doctorId`/`assignedToUserId`, the same
  read-two-features'-services-and-join-in-the-page-component pattern `DoctorProfiles`
  established in Sprint 7 - a conversation never duplicates a patient's appointment data
  or a doctor's name, it only ever looks them up live.
- **Patient Details' "Conversation History" tab is a real integration point now, not a
  placeholder** - it looks up the patient's conversation via `ConversationService` and
  links straight to `/conversations/:id` if one exists, or to the Inbox if not. This is
  the "required integration" touch on a Sprint 4 file called out in the Sprint 9 brief;
  nothing else about Patient Details changed.
- **Dashboard integration**: three more live cards - `ConversationService
  .activeConversationCount()`, `.aiPendingCount()`, and `MessageService
  .totalUnreadCount()` - replace the Sprint 1 hardcoded `Messages: 34` card in the same
  `computed<SummaryCard[]>()` every prior sprint has extended. The "Send Message" quick
  action now navigates to `/conversations` instead of showing a "coming soon" snackbar.

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

Sprint 5 adds `007_create_appointments.sql` - `clinic.appointments`, with `patient_id`
and `doctor_id` foreign keys (`ON DELETE RESTRICT`, since a booked appointment shouldn't
silently vanish if a doctor/patient record is later deleted). Its columns mirror the
`Appointment` model (`appointment_date`/`start_time`/`end_time`/`duration_minutes`,
matching `AppointmentService`'s field-for-field), but it also defines two *generated*
`timestamptz` columns, `start_at`/`end_at` (`GENERATED ALWAYS AS ... STORED`), that exist
purely to back a `GiST` `EXCLUDE` constraint enforcing "no overlapping appointments for
the same doctor" **at the database layer** - the same rule `AppointmentService.
validateBooking()` enforces in the application layer today. Postgres range types need a
single timestamp instant, not a separate date + time pair, hence the generated columns;
the constraint's `WHERE (status <> 'cancelled')` clause means cancelling an appointment
immediately frees that slot for a new booking, matching the mock service's behavior
exactly. This needs the `btree_gist` extension for the `uuid =` operator class inside the
exclusion constraint. Indexes cover `appointment_date` (calendar/daily-schedule queries),
`(doctor_id, appointment_date)` (Daily Schedule's per-doctor-per-day lookup), `patient_id`
(a future "this patient's appointment history" query), and `status` (list filter). Reuses
`clinic.set_updated_at()` the same way `003`-`006` do.

Sprint 6 adds five more, mirroring the settings feature's own service split:
`008_create_clinics.sql` (`clinic.clinics` - the clinic identity columns mirroring
`ClinicProfile` field-for-field, plus `jsonb` columns for `business_hours` and each of
the four `SettingsService` groups). That JSONB choice is a deliberate exception to the
`doctor_schedules`-style "one row per (entity, category)" normalization this project
otherwise prefers - see the migration's header comment for the full reasoning, but in
short: there's no cross-clinic query need for business hours in a single-clinic
deployment the way "which doctors work Mondays" was a real query Sprint 3 needed, and
the AI/WhatsApp/Notification settings shapes will keep changing as those modules get
built, which a rigid table would fight every sprint. `009_create_users.sql`
(`clinic.users`) deliberately has **no `role` column** - unlike the Angular mock's
`ClinicUser.role` single field, the schema is many-to-many-ready via
`012_create_user_roles.sql`, a documented gap between "future-ready schema" and
"today's simpler mock UI" the same way `006_create_patients.sql`'s richer CHECK
constraints already exceeded what `PatientService` enforces in Sprint 4.
`010_create_roles.sql` (`clinic.roles`) uses a plain `varchar` for `name` rather than a
CHECK-constrained enum, specifically so a clinic can define custom roles beyond the
three built-in ones without a schema migration. `011_create_permissions.sql`
(`clinic.permissions`) is the `RolePermission` matrix made durable - one row per
`(role_id, module)`, `UNIQUE (role_id, module)`, mirroring the Angular model exactly.
`012_create_user_roles.sql` (`clinic.user_roles`) is a plain composite-key join table.

Sprint 7 adds seven more, mirroring `KnowledgeBaseService`'s entities: `013_create_services.sql`,
`014_create_faqs.sql`, `016_create_policies.sql`, and `017_create_insurance_providers.sql`
are standalone tables, no FKs, following the `006_create_patients.sql` shape.
`015_create_doctor_profiles.sql` (`clinic.doctor_profiles`) has a `doctor_id` FK to
`clinic.doctors` (`ON DELETE CASCADE` - profile content has no meaning once the doctor
record is gone) with a `UNIQUE (doctor_id)` constraint enforcing the one-profile-per-doctor
rule at the database layer, and uses `text[]` columns for the languages/awards/
certifications/publications/interests lists rather than five child tables, matching the
Angular model's `string[]` fields directly - none of those lists need their own
attributes today. `018_create_message_templates.sql` uses the same `text[]` approach for
`variables`. `019_create_ai_prompt_settings.sql` (`clinic.ai_prompt_settings`) is a
single-row table, but unlike `008_create_clinics.sql`'s JSONB-columns-on-`clinics`
approach for the Sprint 6 settings groups, this one is its own table with an
`id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1)` - the standard Postgres
singleton-table trick, which structurally forbids a second row rather than relying on
application code to enforce it. The two approaches solve the same "one configuration
row" problem differently because they arose in different sprints for different reasons:
008's JSONB columns live *inside* the clinic's own row (there's exactly one clinic, so
nesting was free); AI Prompt Settings is a separate concern from clinic identity, so it
gets its own table rather than another JSONB column bolted onto `clinics`.

Sprint 8 adds two more: `020_create_integrations.sql` bundles three singleton tables in
one file - `clinic.whatsapp_integration`, `clinic.claude_integration`,
`clinic.google_calendar_integration` - each using the `id smallint PRIMARY KEY DEFAULT 1
CHECK (id = 1)` trick `019_create_ai_prompt_settings.sql` established, rather than one
generic `clinic.integrations` table with a `type` discriminator column and nullable
columns for every field of every integration type. Real typed, real `NOT NULL`-capable
columns per table (WhatsApp's `waba_id`, Claude's `temperature`, Google Calendar's
`client_secret`) stay meaningfully constrained in a way a shared nullable-everything
table would not, and the Angular side already models them as three separate interfaces
- the schema mirrors that split rather than fighting it. `021_create_webhooks.sql`
(`clinic.webhooks`) mirrors `018_create_message_templates.sql`'s `text[]` choice for
`events`; unlike `variables` (open-ended merge-field names), webhook events are a closed
vocabulary in the Angular model (`WEBHOOK_EVENTS`), but Postgres has no clean way to
CHECK-constrain individual array elements against an enum without a trigger or domain
type, so that enforcement stays an application-layer concern for now, noted in the
migration's own header comment.

Sprint 9 adds four more, mirroring the Conversation Center's three services:
`022_create_conversations.sql` (`clinic.conversations`) has a `patient_id` FK (`ON DELETE
CASCADE`, unlike appointments' `ON DELETE RESTRICT` - a conversation genuinely has no
meaning once the patient record is gone) and a nullable `assigned_to_user_id` FK with `ON
DELETE SET NULL`, mirroring `ConversationService.setAssignedUser()`'s denormalized
pointer exactly: deleting a staff account un-assigns their conversations rather than
deleting conversation history. `023_create_messages.sql` (`clinic.messages`) is the one
Sprint 9 table with no `updated_at`/trigger - a message is append-only in the mock model
except for the `read` flag, and `sent_at` alone is enough history for that.
`024_create_conversation_notes.sql` (`clinic.conversation_notes`) is its own table
rather than a text column on `conversations`, the same one-to-many reasoning
`004_create_doctor_leaves.sql`/`005_create_clinic_holidays.sql` used for per-doctor
records instead of array columns. `025_create_conversation_assignments.sql`
(`clinic.conversation_assignments`) is the durable form of
`ConversationAssignmentService`'s append-only history - `assigned_to_user_id` here is
`ON DELETE CASCADE` (unlike `conversations`' `SET NULL` pointer), because a history row
naming a since-deleted user is no longer meaningful to keep, whereas the live pointer on
`conversations` should just go back to unassigned.

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
Holidays, and a slot generator; Sprint 4 added Patient Management; Sprint 5 added the
Appointment Engine; Sprint 6 added Clinic Administration & Configuration; Sprint 7 added
the Knowledge Base; Sprint 8 added the Integration Layer; Sprint 9 added the Conversation
Center - all still mock data, with `clinic.doctors`, `clinic.doctor_schedules`,
`clinic.doctor_leaves`, `clinic.clinic_holidays`, `clinic.patients`,
`clinic.appointments`, `clinic.clinics`, `clinic.users`, `clinic.roles`,
`clinic.permissions`, `clinic.user_roles`, `clinic.services`, `clinic.faqs`,
`clinic.doctor_profiles`, `clinic.policies`, `clinic.insurance_providers`,
`clinic.message_templates`, `clinic.ai_prompt_settings`, `clinic.whatsapp_integration`,
`clinic.claude_integration`, `clinic.google_calendar_integration`, `clinic.webhooks`,
`clinic.conversations`, `clinic.messages`, `clinic.conversation_notes`, and
`clinic.conversation_assignments` sitting unconnected in migrations for when a real API
layer exists (see "Doctor Management", "Doctor Schedule & Availability", "Patient
Management", "The Appointment Engine", "Clinic Administration & Configuration",
"Knowledge Base", "Integration Layer", and "Conversation Center" above). Every
top-level feature is now built out - only Settings' AI/WhatsApp integrations, the
Knowledge Base's AI Prompt Settings, the entire Integration Layer's actual API calls,
and the Conversation Center's AI Draft Panel remain unbuilt against a real provider, on
purpose (see the respective sections above for why those are placeholder-only stopping
points, not an oversight - both Sprint 8's and Sprint 9's briefs were explicit that
their AI/messaging surfaces are mock/architecture only). Patient Details' "Future
Appointments" tab still shows the Sprint 4 placeholder text rather than querying
`AppointmentService`, since Patient Details wasn't in Sprint 5's, 6's, 7's, 8's, or 9's
page list - only its "Conversation History" tab was in scope for Sprint 9's required
integration touch. Roles & Permissions is configuration only - no route or action
anywhere in the app actually checks a `RolePermission` yet, since "No authentication
changes yet" was explicit in the Sprint 6 brief and nothing since has changed that. The
architecture exists so each of those is additive work in a predictable place, not a
redesign.
