import { Injectable } from '@nestjs/common';
import { GoogleCalendarConnection, GoogleCalendarSyncEvent, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Running count of sync attempts, split by outcome - the dashboard's "Events Synced Today" tile. */
export interface SyncCountsSince {
  success: number;
  failed: number;
}

// Thin Prisma wrapper covering the two tables this module owns
// (clinic.google_calendar_connections, clinic.google_calendar_sync_events) -
// same one-repository-per-module, one-line-per-Prisma-call shape
// WorkflowRuntimeRepository/WhatsappRepository use.
@Injectable()
export class GoogleCalendarRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Connection (singleton row - see 044_create_google_calendar.sql's header comment) ----

  findLatestConnection(): Promise<GoogleCalendarConnection | null> {
    return this.prisma.googleCalendarConnection.findFirst({ orderBy: { createdAt: 'desc' } });
  }

  createConnection(data: Prisma.GoogleCalendarConnectionCreateInput): Promise<GoogleCalendarConnection> {
    return this.prisma.googleCalendarConnection.create({ data });
  }

  updateConnection(
    id: string,
    data: Prisma.GoogleCalendarConnectionUpdateInput,
  ): Promise<GoogleCalendarConnection> {
    return this.prisma.googleCalendarConnection.update({ where: { id }, data });
  }

  // Stamped after every successful sync (GoogleCalendarSyncService) - the
  // health/dashboard tiles' "Last Sync" value. A no-op if no connection row
  // exists yet (nothing to stamp).
  async touchLastSync(): Promise<void> {
    const connection = await this.findLatestConnection();
    if (!connection) {
      return;
    }
    await this.updateConnection(connection.id, { lastSyncAt: new Date() });
  }

  // ---- Sync history ----

  createSyncEvent(data: Prisma.GoogleCalendarSyncEventCreateInput): Promise<GoogleCalendarSyncEvent> {
    return this.prisma.googleCalendarSyncEvent.create({ data });
  }

  findSyncHistory(where: Prisma.GoogleCalendarSyncEventWhereInput, take: number): Promise<GoogleCalendarSyncEvent[]> {
    return this.prisma.googleCalendarSyncEvent.findMany({
      where,
      orderBy: { syncedAt: 'desc' },
      take,
    });
  }

  // The most recent successful CREATE/UPDATE for an appointment carries the
  // google_event_id GoogleCalendarSyncService needs to act on for a later
  // update/cancel - see 045_create_google_calendar_sync.sql's header comment
  // on why this doubles as the appointment_id <-> google_event_id link
  // instead of a separate mapping table.
  findLatestGoogleEventId(appointmentId: string): Promise<string | null> {
    return this.prisma.googleCalendarSyncEvent
      .findFirst({
        where: { appointmentId, status: 'SUCCESS', operation: { in: ['CREATE', 'UPDATE'] }, googleEventId: { not: null } },
        orderBy: { syncedAt: 'desc' },
        select: { googleEventId: true },
      })
      .then((row) => row?.googleEventId ?? null);
  }

  // Dashboard's "Events Synced Today" tile - counted in Postgres, same
  // reasoning WorkflowRuntimeRepository.countByStatus() uses.
  async countSyncedSince(since: Date): Promise<SyncCountsSince> {
    const [success, failed] = await Promise.all([
      this.prisma.googleCalendarSyncEvent.count({ where: { syncedAt: { gte: since }, status: 'SUCCESS' } }),
      this.prisma.googleCalendarSyncEvent.count({ where: { syncedAt: { gte: since }, status: 'FAILED' } }),
    ]);
    return { success, failed };
  }
}
