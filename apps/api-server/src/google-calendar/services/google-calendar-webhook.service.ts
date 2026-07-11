import { Injectable, Logger } from '@nestjs/common';
import { CalendarSyncOperation } from '../enums/calendar-sync-operation.enum';
import { CalendarSyncStatus } from '../enums/calendar-sync-status.enum';
import { GoogleCalendarRepository } from '../repositories/google-calendar.repository';

/** The `X-Goog-*` headers Google's push notification POST carries - see https://developers.google.com/calendar/api/guides/push. There is no request body. */
export interface GooglePushNotificationHeaders {
  channelId?: string;
  resourceId?: string;
  resourceState?: string;
  resourceUri?: string;
  messageNumber?: string;
}

/**
 * Handles Google's push notification webhook - a headers-only POST Google
 * sends whenever the watched calendar changes, after GoogleCalendarService's
 * OAuth connection registers a watch channel. Deliberately stops at
 * "persist that a notification arrived" (the Sprint 22 brief's "Support
 * Google push notifications. Persist sync history."), not a full
 * Google-to-appointment reverse sync - reconciling an edit made directly in
 * Google Calendar back into clinic.appointments would mean writing new
 * Appointment business rules, which the brief explicitly rules out
 * ("Do not modify Appointment business rules"). GoogleCalendarSyncService
 * remains the only writer of appointment -> event syncs; this service never
 * calls AppointmentsService.
 */
@Injectable()
export class GoogleCalendarWebhookService {
  private readonly logger = new Logger(GoogleCalendarWebhookService.name);

  constructor(private readonly googleCalendarRepository: GoogleCalendarRepository) {}

  async handleNotification(headers: GooglePushNotificationHeaders): Promise<void> {
    // Google's initial "sync" message on channel creation carries no real
    // change - acknowledge without writing history noise for it.
    if (headers.resourceState === 'sync') {
      return;
    }

    this.logger.log(
      `Google Calendar push notification received: channel=${headers.channelId ?? 'unknown'} state=${headers.resourceState ?? 'unknown'}`,
    );

    await this.googleCalendarRepository.createSyncEvent({
      appointmentId: null,
      googleEventId: null,
      operation: CalendarSyncOperation.NOTIFY,
      status: CalendarSyncStatus.SUCCESS,
      errorMessage: null,
      metadata: {
        channelId: headers.channelId ?? null,
        resourceId: headers.resourceId ?? null,
        resourceState: headers.resourceState ?? null,
        resourceUri: headers.resourceUri ?? null,
      },
    });
  }
}
