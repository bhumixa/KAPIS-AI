import { Injectable } from '@nestjs/common';
import { CalendarHealthDto } from '../dto/calendar-health.dto';
import { CalendarStatsDto } from '../dto/calendar-stats.dto';
import { GoogleCalendarRepository } from '../repositories/google-calendar.repository';
import { GoogleCalendarService } from './google-calendar.service';

const PROVIDER_NAME = 'google-calendar';

/**
 * Aggregates GoogleCalendarService's connection state and
 * GoogleCalendarRepository's sync counts into the two read-only views the
 * Sprint 22 brief asks for: GET /health (connected/calendarId/lastSync/
 * provider, the exact four fields named) and the Automation Dashboard's
 * three tiles (GET /stats). Mirrors WorkflowRuntimeService's own
 * health-aggregation shape - a thin composition layer, no new state of its
 * own.
 */
@Injectable()
export class GoogleCalendarHealthService {
  constructor(
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly googleCalendarRepository: GoogleCalendarRepository,
  ) {}

  async getHealth(): Promise<CalendarHealthDto> {
    const connection = await this.googleCalendarService.getConnection();
    return {
      connected: connection.connected,
      calendarId: connection.connected ? connection.calendarId : null,
      lastSync: connection.lastSyncAt,
      provider: PROVIDER_NAME,
    };
  }

  async getStats(): Promise<CalendarStatsDto> {
    const connection = await this.googleCalendarService.getConnection();
    const counts = await this.googleCalendarRepository.countSyncedSince(startOfToday());
    return {
      connected: connection.connected,
      status: connection.status,
      calendarId: connection.connected ? connection.calendarId : null,
      lastSync: connection.lastSyncAt,
      eventsSyncedToday: counts.success,
    };
  }
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}
