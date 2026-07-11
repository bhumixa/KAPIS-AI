import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { GoogleCalendarController } from './google-calendar.controller';
import { GoogleCalendarRepository } from './repositories/google-calendar.repository';
import { GoogleCalendarHealthService } from './services/google-calendar-health.service';
import { GoogleCalendarSyncService } from './services/google-calendar-sync.service';
import { GoogleCalendarWebhookService } from './services/google-calendar-webhook.service';
import { GoogleCalendarService } from './services/google-calendar.service';

/**
 * Sprint 22 - Google Calendar Integration. Imports AppointmentsModule
 * (Sprint 3) purely for its exported AppointmentsService - GoogleCalendarSyncService
 * composes it instead of re-deriving appointment data, the same reuse
 * pattern WorkflowRuntimeModule established for WhatsappModule/
 * AiOrchestratorModule one layer up. AppointmentsModule never imports this
 * module back or knows it exists - it only announces
 * created/updated/cancelled on WorkflowEventsService (common/events,
 * @Global), the same decoupled seam WhatsappModule -> WorkflowRuntimeModule
 * already uses (see workflow-events.module.ts's doc comment). HttpModule
 * backs GoogleCalendarService, the one place that makes an HTTPS call to
 * Google's OAuth/Calendar API - mirrors WhatsappModule/ClaudeModule/N8nModule's
 * own HttpModule usage. No AI, no n8n, no changes to Appointment business
 * rules - this module only reacts to appointment lifecycle events and mirrors
 * them onto Google Calendar.
 */
@Module({
  imports: [HttpModule, AppointmentsModule],
  controllers: [GoogleCalendarController],
  providers: [
    GoogleCalendarRepository,
    GoogleCalendarService,
    GoogleCalendarSyncService,
    GoogleCalendarWebhookService,
    GoogleCalendarHealthService,
  ],
})
export class GoogleCalendarModule {}
