import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AppointmentLifecycleEvent, WorkflowEventsService } from '../../common/events/workflow-events.service';
import { AppointmentsService } from '../../appointments/appointments.service';
import { CalendarSyncOperation } from '../enums/calendar-sync-operation.enum';
import { CalendarSyncStatus } from '../enums/calendar-sync-status.enum';
import { GoogleCalendarRepository } from '../repositories/google-calendar.repository';
import { GoogleCalendarService } from './google-calendar.service';

/**
 * Sprint 22's Appointment -> Google Calendar bridge. Reacts to
 * WorkflowEventsService's appointment.created/updated/cancelled events
 * (emitted by AppointmentsService.create()/update()/remove()) instead of
 * being called directly, the exact seam ConversationWorkflowService already
 * established for whatsapp.incoming-message - AppointmentsModule never
 * imports or knows about GoogleCalendarModule. Every handler re-fetches the
 * canonical appointment via AppointmentsService.findOne() rather than
 * trusting the event payload, so this is the single place appointment data
 * is read for a sync - "Reuse AppointmentService, no duplicated appointment
 * logic" from the Sprint 22 brief. Never throws back into
 * AppointmentsService: a Google Calendar failure is recorded as a FAILED
 * sync-history row and logged, it never fails the appointment operation that
 * triggered it.
 */
@Injectable()
export class GoogleCalendarSyncService implements OnModuleInit {
  private readonly logger = new Logger(GoogleCalendarSyncService.name);

  constructor(
    private readonly workflowEvents: WorkflowEventsService,
    private readonly appointmentsService: AppointmentsService,
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly googleCalendarRepository: GoogleCalendarRepository,
  ) {}

  onModuleInit(): void {
    this.workflowEvents.onAppointmentCreated((payload) => this.runSafely('created', payload, () => this.handleCreated(payload)));
    this.workflowEvents.onAppointmentUpdated((payload) => this.runSafely('updated', payload, () => this.handleUpdated(payload)));
    this.workflowEvents.onAppointmentCancelled((payload) => this.runSafely('cancelled', payload, () => this.handleCancelled(payload)));
  }

  /** POST /google-calendar/sync/:appointmentId - manual sync (Angular's Manual Sync page). Same logic the automatic listeners use, just callable on demand. */
  async syncNow(appointmentId: string): Promise<void> {
    const existingGoogleEventId = await this.googleCalendarRepository.findLatestGoogleEventId(appointmentId);
    if (existingGoogleEventId) {
      await this.handleUpdated({ appointmentId });
    } else {
      await this.handleCreated({ appointmentId });
    }
  }

  private async handleCreated(payload: AppointmentLifecycleEvent): Promise<void> {
    const appointment = await this.appointmentsService.findOne(payload.appointmentId);
    const event = await this.googleCalendarService.createEvent(appointment);
    await this.recordSync(payload.appointmentId, event.googleEventId, CalendarSyncOperation.CREATE, null);
  }

  private async handleUpdated(payload: AppointmentLifecycleEvent): Promise<void> {
    const appointment = await this.appointmentsService.findOne(payload.appointmentId);
    const googleEventId = await this.googleCalendarRepository.findLatestGoogleEventId(payload.appointmentId);
    if (!googleEventId) {
      // Never synced before (e.g. connected after the appointment was
      // created) - an update becomes a create.
      const event = await this.googleCalendarService.createEvent(appointment);
      await this.recordSync(payload.appointmentId, event.googleEventId, CalendarSyncOperation.CREATE, null);
      return;
    }
    const event = await this.googleCalendarService.updateEvent(appointment, googleEventId);
    await this.recordSync(payload.appointmentId, event.googleEventId, CalendarSyncOperation.UPDATE, null);
  }

  private async handleCancelled(payload: AppointmentLifecycleEvent): Promise<void> {
    const googleEventId = await this.googleCalendarRepository.findLatestGoogleEventId(payload.appointmentId);
    if (!googleEventId) {
      // Nothing was ever synced for this appointment - nothing to delete.
      return;
    }
    await this.googleCalendarService.deleteEvent(googleEventId);
    await this.recordSync(payload.appointmentId, googleEventId, CalendarSyncOperation.DELETE, null);
  }

  private async runSafely(
    label: string,
    payload: AppointmentLifecycleEvent,
    fn: () => Promise<void>,
  ): Promise<void> {
    try {
      await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Google Calendar sync error';
      this.logger.error(`Failed to sync appointment ${payload.appointmentId} (${label}) to Google Calendar: ${message}`);
      await this.recordSync(
        payload.appointmentId,
        null,
        label === 'cancelled' ? CalendarSyncOperation.DELETE : label === 'created' ? CalendarSyncOperation.CREATE : CalendarSyncOperation.UPDATE,
        message,
      ).catch(() => undefined);
    }
  }

  private async recordSync(
    appointmentId: string,
    googleEventId: string | null,
    operation: CalendarSyncOperation,
    errorMessage: string | null,
  ): Promise<void> {
    await this.googleCalendarRepository.createSyncEvent({
      appointmentId,
      googleEventId,
      operation,
      status: errorMessage ? CalendarSyncStatus.FAILED : CalendarSyncStatus.SUCCESS,
      errorMessage,
    });
    if (!errorMessage) {
      await this.googleCalendarRepository.touchLastSync();
    }
  }
}
