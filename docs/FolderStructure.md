# Folder Structure

## Repository root

```
kapis-ai-platform/
  apps/
    clinic-admin/            Angular 20 admin console
  services/
    n8n-workflows/           Exported n8n workflow JSON (mounted into the n8n container)
  database/
    schema/                  Bootstrap SQL - runs once, automatically, on first Postgres start
    migrations/               Versioned schema changes (002_create_doctors.sql, Sprint 2)
    seed/                     Demo data scripts, applied manually (empty until product tables exist)
  docker/                    Per-service scratch/config dirs (currently unused placeholders)
  docs/                      This documentation set
  scripts/                   One-off dev scripts
  docker-compose.yml
  .env.example
  .editorconfig
  .gitignore
```

## `apps/clinic-admin/src/app`

```
app/
  app.ts / app.html / app.scss     Root shell - just <router-outlet>
  app.routes.ts                    Top-level route table (login vs. dashboard shell)
  app.config.ts                    Application-wide providers (router, HTTP client + interceptors, animations)

  core/                            Singletons & cross-cutting concerns. Imports nothing from features/.
    constants/
      route-paths.constant.ts        Single source of truth for every route segment/path
      storage-keys.constant.ts       localStorage key names
      nav-items.constant.ts          Sidenav configuration (label/icon/route per feature)
    guards/
      auth.guard.ts                  Blocks protected routes when not authenticated
      guest.guard.ts                 Blocks /login when already authenticated
    interceptors/
      auth.interceptor.ts            Attaches Bearer token to same-origin API requests
      error.interceptor.ts           401 -> logout + redirect to /login
      loading.interceptor.ts         Drives LoadingService off the HTTP request lifecycle
    models/
      user.model.ts, auth.model.ts, nav-item.model.ts, breadcrumb.model.ts
    services/
      auth.service.ts                Session state (signal-based), dummy login/logout
      token-storage.service.ts       Only file that touches localStorage
      loading.service.ts             In-flight request counter -> isLoading signal
    utils/
      get-initials.util.ts           "Jane Doe" -> "JD" (toolbar avatar)
      build-breadcrumbs.util.ts      Walks ActivatedRouteSnapshot tree -> Breadcrumb[]

  shared/                           Reusable, feature-agnostic UI.
    components/
      breadcrumb/                    Renders the trail built by build-breadcrumbs.util.ts
      loading/                       Top-of-viewport progress bar bound to LoadingService
      coming-soon/                   Generic placeholder; title comes from route data
      not-found/                     404 page

  layout/                           Page shells - own chrome, not content.
    dashboard-layout/                Toolbar + sidenav + breadcrumb + <router-outlet>
    login-layout/                    Centered, unauthenticated shell
    components/
      toolbar/                       App title, user menu, mobile menu toggle (emits event)
      sidenav/                       Nav list driven by nav-items.constant.ts

  features/                         One folder per business capability. Each lazy-loaded.
    auth/
      login/                          Reactive form -> AuthService.login()
    dashboard/                       Summary cards + quick actions (Doctors count is live)
      dashboard-summary.model.ts       Feature-local models (not in core/models - not shared elsewhere)
    doctors/                         Sprint 2 - full CRUD against mock data
      doctors.routes.ts                Routes: '' / 'add' / ':id' / ':id/edit'
      models/
        doctor.model.ts                 Doctor, DoctorInput (Omit<Doctor, id|createdAt|updatedAt>)
      services/
        doctor.service.ts                Signal-based reads (doctors/doctorCount) + Observable CRUD
      pages/                            Routed screens - own state, call DoctorService
        doctor-list/                      Search + status filter + table + empty state
        doctor-add/                       DoctorForm -> createDoctor()
        doctor-edit/                      DoctorForm prefilled -> updateDoctor()
        doctor-details/                   Read-only profile (DoctorCard)
      components/                       Presentational - input()/output() only
        doctor-table/                     Sort + paginate + row actions (view/edit/delete)
        doctor-form/                      Shared reactive form for add & edit
        doctor-card/                      Profile display used by doctor-details
        doctor-delete-dialog/             MatDialog confirmation
    patients/     patients.routes.ts    Routes array -> ComingSoon (title: "Patients")
    appointments/ appointments.routes.ts  Routes array -> ComingSoon (title: "Appointments")
    settings/     settings.routes.ts    Routes array -> ComingSoon (title: "Settings")

theme/
  theme-colors.scss                 M3 tonal palettes generated from brand hex colors (do not hand-edit)

environments/
  environment.ts                    Dev defaults (used by `ng serve` and dev builds)
  environment.production.ts         Swapped in for production via angular.json fileReplacements
```

### Naming conventions in play

- **Components**: `<name>.ts` / `<name>.html` / `<name>.scss` (no `.component.` infix) -
  this is the Angular 20 CLI's own default naming since `ng new`/`ng generate` produced
  `app.ts`/`app.html` rather than `app.component.ts`.
- **Everything else keeps a suffix**: `.service.ts`, `.guard.ts`, `.interceptor.ts`,
  `.model.ts`, `.constant.ts`, `.util.ts`, `.routes.ts` - so a file's role is obvious from
  its name in a flat search/import list.
- **One `PascalCase` class per file**, file name in `kebab-case` - the Angular 20
  default (`export class Login`, not `LoginComponent`) since the folder name already
  says "this is the login component."
