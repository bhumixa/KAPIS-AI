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
  `NotFound`, `ComingSoon`, `Breadcrumb`. `ComingSoon` reads its title from route `data`
  so one component serves four different nav items instead of four near-duplicates.
- **`layout/`** - page *shells*, not page content: `DashboardLayout` (toolbar + sidenav +
  breadcrumb + `<router-outlet>`) and `LoginLayout` (centered, unauthenticated). Feature
  routes render *inside* these shells; the shells never know what feature is active.
- **`features/`** - one folder per business capability (`auth`, `dashboard`, `doctors`,
  `patients`, `appointments`, `settings`). Each is lazy-loaded independently. Feature-only
  models (e.g. `SummaryCard` in `dashboard/`, `Doctor`/`DoctorInput` in `doctors/`) stay
  local to the feature instead of polluting `core/models/`. `doctors/` is the first
  feature with real depth - it splits into `pages/` (routed screens: list, add, edit,
  details) and `components/` (reusable pieces those pages assemble: table, form, card,
  delete dialog) - see "Doctor Management" below.

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

`doctors.routes.ts` now has four entries (`''`, `add`, `:id`, `:id/edit`) instead of the
single `ComingSoon` entry it shipped with in Sprint 1 - proof of the design intent noted
above: this was a diff to an existing routes file, not a rewrite. `patients.routes.ts` /
`appointments.routes.ts` / `settings.routes.ts` still each export a single-entry `Routes`
array pointing at `ComingSoon`, waiting for the same treatment in later sprints.

Breadcrumbs are generic: any route can set `data: { breadcrumb: 'Label' }` and
`buildBreadcrumbs()` (`core/utils/build-breadcrumbs.util.ts`) walks the activated route
tree collecting them - nested routes get breadcrumbs for free. `doctors.routes.ts` sets a
distinct label per route (`Doctors`, `Add Doctor`, `Doctor Details`, `Edit Doctor`)
instead of the single static `title` the `ComingSoon` placeholder used.

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
`docs/DevelopmentGuide.md`) rather than auto-run - it is not wired up yet since Sprint 2
still runs on mock data. Indexes cover the three things the doctor list actually
filters/sorts by (`last_name`, `specialization`, `status`); `registration_number` and
`email` are unique constraints, matching the mock service's assumption that both
identify a doctor uniquely.

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

Per Sprint 1 scope: no WhatsApp integration, no Claude/OpenAI calls, no Google Calendar,
no real JWT backend. Sprint 2 adds the Doctors feature and its migration, but Patients,
Appointments, and Settings are still "Coming Soon" placeholders, and `clinic.doctors` is
not connected to `DoctorService` yet - it's mock data today by design (see "Doctor
Management" above). The architecture exists so each of those is additive work in a
predictable place, not a redesign.
