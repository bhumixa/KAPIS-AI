# Folder Structure

## Repository root

```
kapis-ai-platform/
  apps/
    clinic-admin/            Angular 20 admin console
    api-server/              NestJS 11 backend API (Sprint 11+, see docs/DevelopmentGuide.md).
                                src/claude/ (Sprint 18) is the newest module - the real Claude
                                provider adapter: ClaudeHttpService (raw HTTPS), ClaudeResponseMapper,
                                ClaudeHealthService, ClaudeProviderService (implements ai/'s AiProvider
                                port, bound to the AI_PROVIDER token). src/ai/ (Sprint 17) is the AI
                                Orchestration Engine: ConversationContextBuilderService,
                                PromptBuilderService, PromptTemplateService (+ CRUD controller),
                                AIExecutionService (now calls AI_PROVIDER instead of a mock, Sprint 18),
                                AIHistoryService (+ Sprint 18's ai_provider_logs write), wired together
                                by AIOrchestratorService + AIController. src/conversations/ (Sprint 16) -
                                repository + four services (ConversationService, MessageService,
                                ConversationHistoryService, ConversationContextService) + controller,
                                mirroring the doctors/patients/appointments module shape; three of its
                                four services are exported (Sprint 17) for AIOrchestratorModule to reuse
  services/
    n8n-workflows/           Exported n8n workflow JSON (mounted into the n8n container,
                                and read by apps/api-server's WorkflowRegistryService).
                                appointments/, patients/, conversations/, automation/,
                                templates/ subfolders (Sprint 14); real webhook trigger
                                nodes + importable into n8n as of Sprint 15
  database/
    schema/                  Bootstrap SQL - runs once, automatically, on first Postgres start
    migrations/               Versioned schema changes (002-025 Sprint 2-9, 033 Sprint 15,
                                034-036 Sprint 17, 037 Sprint 18)
    seed/                     Demo data scripts, applied manually - 002_conversation_engine_seed.sql
                                (Sprint 16) is a demo clinic + staff users with fixed ids
                                apps/clinic-admin's mock Settings UserService also uses, so
                                Conversations' real assignedToUserId FK has something to resolve;
                                003_ai_orchestration_seed.sql (Sprint 17) seeds the seven prompt
                                templates plus the single 'mock' clinic.ai_models row (unrelated to
                                the real Claude provider - see docs/Architecture.md's Sprint 18 notes)
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
        patient-details/                  Overview tab (cards) + Future Appointments placeholder
                                            tab + Conversation History tab (links to the patient's
                                            real conversation via ConversationService, Sprint 9)
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
    conversations/                      Sprint 9 - the Conversation Center; Sprint 16 connected
                                          it to apps/api-server's real ConversationsModule (still
                                          no AI API/WhatsApp calls - persist-only, per the brief)
      conversations.routes.ts           Routes: '' (Inbox) / ':id' (Conversation Details) - no
                                            shared sub-nav, unlike every other Sprint 6-8 feature
      models/
        conversation.model.ts            ConversationStatus, Conversation, ConversationInput
        message.model.ts                 MessageDirection, MessageSender, Message, MessageInput
        conversation-note.model.ts       ConversationNote, ConversationNoteInput
        conversation-assignment.model.ts ConversationAssignment, ASSIGNABLE_ROLES (reuses core's UserRole)
        ai-draft.model.ts                AIDraft, AIDraftStatus - client-only view state, never persisted
                                            (Sprint 17: status also carries 'loading-context'/'context-ready')
        conversation-quick-filter.model.ts  ConversationQuickFilter - inbox filter vocabulary,
                                              deliberately distinct from ConversationStatus
        conversation-list-item.model.ts  ConversationListItem - inbox row view model (Conversation
                                              joined with patient/message data)
      services/
        conversation.service.ts          Conversations (status/tags) + internal notes - real
                                            HttpClient calls as of Sprint 16 (same signal shape)
        message.service.ts               Message timeline, unread counts, sendMessage()/markConversationRead() -
                                            real HttpClient calls as of Sprint 16
        conversation-assignment.service.ts  Append-only assignment history; assign()/unassign() call
                                              back into ConversationService.setAssignedUser() (sync,
                                              not Observable - see Architecture.md for why) - real
                                              HttpClient calls as of Sprint 16 (one PATCH per assign,
                                              not two requests)
      pages/                            Routed screens - own state, call the three services
        inbox/                            Search + quick filters + ConversationList - the Contact List
        conversation-details/             Patient info + appointment summary + assignment + tags +
                                             message timeline + AI Draft Panel + internal notes
      components/                       Presentational - input()/output() only
        conversation-filters/             Quick-filter chip row (All/Open/Assigned/AI Pending/Closed)
        conversation-list/                Inbox row list - plain flex markup, not mat-list-item
                                             (Material's line-count grid overlapped a 3-line row)
        message-timeline/                 Chat bubbles (incoming/outgoing) + reply composer
        ai-draft-panel/                   Load Context/Preview Prompt/Generate/Regenerate/Accept/Edit/
                                             Copy + execution history - real HttpClient calls to
                                             apps/api-server's AIOrchestratorModule, which as of Sprint 18
                                             calls the real Claude API server-side (Angular still never
                                             calls an AI provider directly - see docs/Architecture.md)
        internal-notes/                   Notes CRUD list + add/edit form
        conversation-tags/                Chip-based tag editor (mat-chip-grid)
        conversation-assignment/          Assign-to select (Receptionist/Doctor) + current-assignee chip
    ai/                                Sprint 17 - shared AI Orchestration Engine client, consumed by
                                          both conversations/ai-draft-panel and automation/automation-dashboard
                                          (cross-feature import, the same pattern conversation.service.ts
                                          already uses for PatientService)
      models/
        ai-context.model.ts              ConversationContext, AiConversationContext (mirrors
                                            apps/api-server's ConversationContextDto/AiConversationContextDto)
        prompt.model.ts                  Prompt, PromptMetadata
        prompt-template.model.ts         PromptTemplateType, PromptTemplate, PromptTemplateInput
        ai-execution.model.ts            AiExecutionResult, AiExecutionHistory, GenerateRequest,
                                            AiDashboardStats (+ provider/model/totalTokensToday/
                                            successRatePercent, Sprint 18), AiProviderHealth (Sprint 18)
      services/
        ai-orchestrator.service.ts       context()/prompt-preview()/generate()/history()/stats()/
                                            provider-health() - real HttpClient calls to apps/api-server's
                                            AIOrchestratorModule; Angular itself never calls Claude
        prompt-template.service.ts       Prompt template CRUD - real HttpClient calls to
                                            apps/api-server's PromptTemplatesController
    automation/                        Sprint 14/15 - the Automation Center. "Import"
                                          registers+activates a workflow in n8n; "Run"
                                          calls its real n8n webhook (Sprint 15). Sprint 17 added an
                                          AI Orchestration Engine stats strip (executions today, average
                                          latency, prompt template count); Sprint 18 extends it with the
                                          real Claude provider's name/model, token usage, success rate,
                                          and a reachability chip
      automation.routes.ts              Routes: '' (Automation Dashboard) only
      models/
        workflow.model.ts                WorkflowCategory, WorkflowTriggerType, WorkflowDefinition
        workflow-execution.model.ts      WorkflowExecutionStatus, WorkflowExecution
      services/
        automation.service.ts            Real HttpClient calls to apps/api-server's N8nModule -
                                            no mock branch, since there was no pre-existing
                                            Automation UI to migrate off mock data
      pages/
        automation-dashboard/             Workflow cards with a Run button (calls the real
                                             trigger endpoint) + a Recent Executions table + the
                                             AI stats strip and Claude health chips (features/ai's
                                             services; Sprint 17 added the strip, Sprint 18 the chips)

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
