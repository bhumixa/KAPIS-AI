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
    migrations/               Versioned schema changes (002-021, Sprint 2-8)
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
      nav-items.constant.ts          Sidenav configuration (label/icon/route per feature, nested children allowed)
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
      confirm-dialog/                Generic yes/no MatDialog (Sprint 3); promoted once a
                                        2nd/3rd feature needed the same shell DoctorDeleteDialog had.
                                        Patient delete (Sprint 4) is its 4th consumer, Appointment
                                        cancel (Sprint 5) its 5th, User delete (Sprint 6) its 6th.

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
    doctors/                         Sprint 2-3 - full CRUD against mock data
      doctors.routes.ts                Routes: '' / 'add' / 'schedule' / ':id' / ':id/edit'
      models/
        doctor.model.ts                 Doctor, DoctorInput (Omit<Doctor, id|createdAt|updatedAt>)
        doctor-schedule.model.ts        DayOfWeek, DaySchedule, DoctorSchedule, DoctorScheduleInput (Sprint 3)
        doctor-leave.model.ts           LeaveType, DoctorLeave, DoctorLeaveInput (Sprint 3)
        clinic-holiday.model.ts         ClinicHoliday, ClinicHolidayInput (Sprint 3)
        time-slot.model.ts              TimeSlot, BookedSlot, SlotGeneratorInput (Sprint 3)
      services/
        doctor.service.ts                Signal-based reads (doctors/doctorCount) + Observable CRUD
        schedule.service.ts              Signal-based reads (schedules/leaves/holidays) + Observable CRUD (Sprint 3)
        availability.service.ts          Derives isDoctorAvailableOn/doctorsAvailableToday/doctorsOnLeaveToday + generateSlots() (Sprint 3)
      pages/                            Routed screens - own state, call DoctorService
        doctor-list/                      Search + status filter + table + empty state
        doctor-add/                       DoctorForm -> createDoctor()
        doctor-edit/                      DoctorForm prefilled -> updateDoctor()
        doctor-details/                   Profile tab (DoctorCard) + Schedule tab (WeeklyScheduleEditor, readonly)
      components/                       Presentational - input()/output() only
        doctor-table/                     Sort + paginate + row actions (view/edit/delete)
        doctor-form/                      Shared reactive form for add & edit
        doctor-card/                      Profile display used by doctor-details
        doctor-delete-dialog/             MatDialog confirmation
        schedule-nav/                     Pill-tab sub-nav shared by schedule-list/doctor-leave/clinic-holidays (Sprint 3)
        weekly-schedule-editor/           Mon-Sun working/off + hours grid; reused editable & readonly (Sprint 3)
        leave-form/                       MatDialog form for DoctorLeave create/edit (Sprint 3)
        holiday-form/                     MatDialog form for ClinicHoliday create/edit (Sprint 3)
      schedule/                        Sprint 3 sub-feature: routed screens for Doctor Schedule
        schedule.routes.ts                Routes: '' / 'leave' / 'holidays' / 'manage/:doctorId'
        utils/
          schedule-date.util.ts             Day-of-week/date/time helpers (pure functions)
          generate-available-slots.util.ts  The Slot Generator - pure, DI-free
        pages/
          schedule-list/                     One row per doctor + today's status + "Manage Schedule"
          manage-schedule/                    WeeklyScheduleEditor (editable) for one doctor
          doctor-leave/                       Leave CRUD table + LeaveForm dialog
          clinic-holidays/                    Holiday CRUD table + HolidayForm dialog
    patients/                         Sprint 4 - full CRUD against mock data
      patients.routes.ts                Routes: '' / 'add' / ':id' / ':id/edit'
      models/
        patient.model.ts                 Gender, PatientStatus, BloodGroup, EmergencyContact,
                                            Patient, PatientInput
      services/
        patient.service.ts               Signal-based reads (patients/patientCount) + Observable CRUD
      utils/
        patient-age.util.ts               calculateAge() - pure, DI-free (dateOfBirth -> years)
      pages/                            Routed screens - own state, call PatientService
        patient-list/                     Search + status filter + table + empty state
        patient-add/                      PatientForm -> createPatient()
        patient-edit/                     PatientForm prefilled -> updatePatient()
        patient-details/                  Overview tab (cards) + Future Appointments/Conversation
                                            History placeholder tabs
      components/                       Presentational - input()/output() only
        patient-table/                    Sort + paginate + row actions (view/edit/delete)
        patient-form/                     Shared reactive form for add & edit (nested
                                            emergencyContact FormGroup)
    appointments/                      Sprint 5 - the core scheduling engine
      appointments.routes.ts            Routes: '' / 'book' / 'calendar' / 'daily-schedule' / ':id' / ':id/edit'
      models/
        appointment.model.ts             AppointmentStatus, AppointmentType, Appointment, AppointmentInput
      services/
        appointment.service.ts           Signal-based reads (appointments + 4 dashboard counts) +
                                            Observable CRUD; reuses DoctorService/PatientService/
                                            AvailabilityService instead of duplicating their logic
      utils/
        appointment-time.util.ts          doTimeRangesOverlap() - pure, DI-free
        calendar.util.ts                  Month/week date-grid generation - pure, DI-free
      pages/                            Routed screens - own state, call AppointmentService
        appointment-list/                 Search + date/doctor/status filters + table + empty state
        appointment-book/                 mat-stepper wizard: patient -> doctor -> date+slot -> confirm
        appointment-edit/                 Reschedule: date/slot/type/status/notes -> updateAppointment()
        appointment-details/              Patient/Doctor info cards + timeline + notes
        calendar-view/                    Month/Week/Day toggle (mat-button-toggle-group, not routes)
        daily-schedule/                   Per-doctor day-sheet: every slot, free or booked
      components/                       Presentational - input()/output() only
        appointment-table/                Sort + paginate + row actions (view/edit/cancel/complete)
        slot-picker/                      Clickable time-slot grid, shared by book & edit
    settings/                          Sprint 6 - Clinic Administration & Configuration
      settings.routes.ts                Routes: '' / business-hours / appointment-settings /
                                            users / roles-permissions / ai-settings /
                                            whatsapp-settings / notification-settings (all flat)
      models/
        clinic-profile.model.ts          ClinicProfile, ClinicProfileInput, TIME_ZONES/CURRENCIES/LANGUAGES
        business-hours.model.ts          BusinessDayHours, BusinessHours (reuses doctors' DayOfWeek)
        appointment-settings.model.ts    AppointmentSettings, AppointmentSettingsInput
        clinic-user.model.ts             ClinicUser, ClinicUserInput (reuses core's UserRole)
        permission.model.ts              PermissionModule, PermissionActions, RolePermission
        ai-settings.model.ts             AISettings, AIProvider (placeholder only)
        whatsapp-settings.model.ts       WhatsAppSettings (placeholder only)
        notification-settings.model.ts   NotificationSettings
      services/
        clinic.service.ts                ClinicProfile + BusinessHours signals, isOpenNow computed
        settings.service.ts              Appointment/AI/WhatsApp/Notification settings signals
        user.service.ts                  User CRUD + role permission matrix
      pages/                            Routed screens - own state, call one of the three services
        clinic-profile/                   Reactive form -> ClinicService.updateClinicProfile()
        business-hours/                   Hosts business-hours-editor -> ClinicService.updateBusinessHours()
        appointment-settings/             Reactive form -> SettingsService.updateAppointmentSettings()
        user-management/                  Table + add/edit dialog + delete confirm -> UserService
        roles-permissions/                Role toggle + permission matrix -> UserService.updateRolePermission()
        ai-settings/                      Reactive form (placeholder) -> SettingsService.updateAiSettings()
        whatsapp-settings/                Reactive form (placeholder) -> SettingsService.updateWhatsAppSettings()
        notification-settings/            Reactive form -> SettingsService.updateNotificationSettings()
      components/                       Presentational - input()/output() only
        settings-nav/                     Pill sub-nav shared by all 8 pages (mirrors schedule-nav)
        business-hours-editor/            Weekly grid FormArray (same shape as WeeklyScheduleEditor, own fields)
        user-table/                       Sort + paginate + row actions (edit/delete)
        user-form/                        MatDialog form for create/edit (mirrors LeaveForm/HolidayForm)
        permission-matrix/                View/Create/Update/Delete checkbox grid for one role
    knowledge-base/                    Sprint 7 - content that powers future AI conversations
      knowledge-base.routes.ts          Routes: '' / faqs / doctor-profiles / policies /
                                            insurance-providers / message-templates /
                                            ai-prompt-settings (all flat)
      models/
        service.model.ts                 ClinicService, ClinicServiceInput
        faq.model.ts                     Faq, FaqInput, FaqStatus
        doctor-profile-extension.model.ts  DoctorProfileExtension (doctorId FK, no doctor
                                              identity fields - extends DoctorService's Doctor
                                              without duplicating it)
        policy.model.ts                  Policy, PolicyType, POLICY_TYPES
        insurance-provider.model.ts      InsuranceProvider, InsuranceProviderInput
        message-template.model.ts        MessageTemplate, MessageTemplateType, variables: string[]
        ai-prompt-settings.model.ts      AIPromptSettings (placeholder only)
      services/
        knowledge-base.service.ts        One service for all seven entities - signals + Observable
                                            CRUD, same mock-data shape as DoctorService/UserService
      pages/                            Routed screens - own state, call KnowledgeBaseService
        services/                         Table + add/edit dialog + delete confirm
        faqs/                             Table + add/edit dialog + delete confirm
        doctor-profiles/                  Doctor list (joined with DoctorService.doctors()) +
                                             edit-profile-content dialog
        policies/                         Table + add/edit dialog + delete confirm
        insurance-providers/              Table + add/edit dialog + delete confirm
        message-templates/                Table + add/edit dialog + delete confirm
        ai-prompt-settings/               Reactive form (placeholder) -> updateAiPromptSettings()
      components/                       Presentational - input()/output() only
        knowledge-base-nav/               Pill sub-nav shared by all seven pages (mirrors SettingsNav)
        service-table/, service-form/     Services CRUD
        faq-table/, faq-form/             FAQs CRUD
        doctor-profile-table/,            Doctor Profiles - table joins Doctor + optional
          doctor-profile-form/              DoctorProfileExtension; form edits extension fields only
        policy-table/, policy-form/       Policies CRUD
        insurance-provider-table/,        Insurance Providers CRUD
          insurance-provider-form/
        message-template-table/,         Message Templates CRUD (variables edited as a
          message-template-form/           comma-separated field, not a chip editor)
    integrations/                      Sprint 8 - the Integration Layer (config only, no
                                          external API calls)
      integrations.routes.ts            Routes: '' / whatsapp / claude / google-calendar /
                                            webhooks (all flat)
      models/
        integration-status.model.ts      IntegrationStatus, IntegrationTestResult - shared
                                            across all three provider integrations
        whatsapp-integration.model.ts    WhatsAppIntegration, WhatsAppIntegrationInput
        claude-integration.model.ts      ClaudeIntegration, ClaudeIntegrationInput
        google-calendar-integration.model.ts  GoogleCalendarIntegration, ...Input
        webhook.model.ts                 Webhook, WebhookEvent, WEBHOOK_EVENTS
      services/
        integration.service.ts           One service for all four integrations - signals +
                                            Observable CRUD, plus mocked test*Connection()
                                            methods (delay + canned success, no HTTP call)
      pages/                            Routed screens - own state, call IntegrationService
        integrations-dashboard/           Status-only cards for WhatsApp/Claude/Google
                                             Calendar/Webhooks, each linking to its page
        whatsapp/                         Reactive form + status chip + Test Connection
        claude/                           Reactive form + status chip + Test Connection
        google-calendar/                  Reactive form + status chip + Test Connection
        webhooks/                         Table + add/edit dialog + delete confirm
      components/                       Presentational - input()/output() only
        integrations-nav/                 Pill sub-nav shared by all five pages
        integration-status-chip/          Connected/Disconnected/Error pill, reused by the
                                             config pages, the Integrations Dashboard cards,
                                             and the main Dashboard's health row
        webhook-table/, webhook-form/     Webhooks CRUD (events: fixed-vocabulary multi-select)

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
