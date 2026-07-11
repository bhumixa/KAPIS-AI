import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleCalendarConnection } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { AppointmentDto } from '../../appointments/dto/appointment.dto';
import { AppConfig } from '../../config/configuration';
import { CalendarConnectionDto } from '../dto/calendar-connection.dto';
import { CalendarEventDto } from '../dto/calendar-event.dto';
import { CalendarSyncLogDto } from '../dto/calendar-sync-log.dto';
import { QuerySyncHistoryDto } from '../dto/query-sync-history.dto';
import { CalendarConnectionStatus } from '../enums/calendar-connection-status.enum';
import { describeGoogleCalendarError, GoogleCalendarApiError } from '../google-calendar-error.util';
import { GoogleCalendarRepository } from '../repositories/google-calendar.repository';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface GoogleEventResource {
  id: string;
  summary?: string;
  description?: string;
  status?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
// Refresh a bit before actual expiry so an in-flight request never races an
// about-to-expire token.
const TOKEN_REFRESH_SKEW_MS = 60_000;

/**
 * Sprint 22 - the one place that talks to Google (OAuth token exchange/
 * refresh and the Calendar Events API), mirroring WhatsappHttpService's
 * "single HTTP boundary" shape but folded into one service since the Sprint
 * 22 brief names exactly four services for this module (no fifth
 * *-http.service.ts split). GoogleCalendarSyncService/GoogleCalendarController
 * are the only callers; every failure is normalized to a
 * GoogleCalendarApiError by describeGoogleCalendarError() (never leaks
 * request headers, which carry the OAuth access token).
 */
@Injectable()
export class GoogleCalendarService {
  private readonly googleConfig: AppConfig['googleCalendar'];
  private readonly frontendBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly googleCalendarRepository: GoogleCalendarRepository,
  ) {
    this.googleConfig = this.configService.get<AppConfig['googleCalendar']>('app.googleCalendar')!;
    const corsOrigins = this.configService.get<AppConfig['corsOrigins']>('app.corsOrigins') ?? [];
    this.frontendBaseUrl = corsOrigins[0] ?? '';
  }

  /** GET /oauth/callback's post-exchange redirect target - the Angular Connection page, reusing the first configured CORS origin (the Angular dev server/deployment url) rather than a second hardcoded var. */
  getFrontendRedirectUrl(): string {
    return `${this.frontendBaseUrl}/integrations/google-calendar`;
  }

  // ---- OAuth ----

  /** The URL the Angular Connection page redirects the browser to for Google's hosted consent screen. */
  getAuthUrl(state: string): string {
    this.assertConfigured();
    const params = new URLSearchParams({
      client_id: this.googleConfig.clientId,
      redirect_uri: this.googleConfig.redirectUri,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: CALENDAR_SCOPE,
      state,
    });
    return `${this.googleConfig.authUrl}?${params.toString()}`;
  }

  /** GET /oauth/callback - exchanges the authorization code Google redirected back with for tokens and persists the connection. */
  async handleOAuthCallback(code: string): Promise<CalendarConnectionDto> {
    this.assertConfigured();
    try {
      const response = await firstValueFrom(
        this.httpService.post<TokenResponse>(
          this.googleConfig.tokenUrl,
          new URLSearchParams({
            code,
            client_id: this.googleConfig.clientId,
            client_secret: this.googleConfig.clientSecret,
            redirect_uri: this.googleConfig.redirectUri,
            grant_type: 'authorization_code',
          }).toString(),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: this.googleConfig.httpTimeoutMs,
          },
        ),
      );

      const tokens = response.data;
      const existing = await this.googleCalendarRepository.findLatestConnection();
      const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);
      const data = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? existing?.refreshToken ?? '',
        tokenExpiry,
        status: CalendarConnectionStatus.CONNECTED,
      };

      const connection = existing
        ? await this.googleCalendarRepository.updateConnection(existing.id, data)
        : await this.googleCalendarRepository.createConnection({ ...data, calendarId: 'primary' });

      return toConnectionDto(connection);
    } catch (error) {
      throw describeGoogleCalendarError(error);
    }
  }

  /** Clears the stored tokens and marks the connection disconnected - the row itself is kept for sync history's foreign appointment_id lookups. */
  async disconnect(): Promise<void> {
    const existing = await this.googleCalendarRepository.findLatestConnection();
    if (!existing) {
      return;
    }
    await this.googleCalendarRepository.updateConnection(existing.id, {
      accessToken: '',
      refreshToken: '',
      tokenExpiry: null,
      status: CalendarConnectionStatus.DISCONNECTED,
    });
  }

  async refreshToken(): Promise<CalendarConnectionDto> {
    const connection = await this.requireConnection();
    if (!connection.refreshToken) {
      throw new GoogleCalendarApiError(
        'No refresh token on file - reconnect the Google account.',
        null,
        'configuration_error',
        false,
      );
    }
    const refreshed = await this.exchangeRefreshToken(connection.id, connection.refreshToken);
    return toConnectionDto(refreshed);
  }

  async getConnection(): Promise<CalendarConnectionDto> {
    const connection = await this.googleCalendarRepository.findLatestConnection();
    return connection ? toConnectionDto(connection) : DISCONNECTED_CONNECTION_DTO;
  }

  // ---- Events - reused by both GoogleCalendarSyncService (automatic, off
  // AppointmentsService's create/update/cancel events) and
  // GoogleCalendarController's manual-sync endpoint (Angular's Manual Sync
  // page). Always builds the event body from the AppointmentDto the caller
  // already fetched via AppointmentsService.findOne() - this service never
  // re-derives appointment data itself, satisfying "Reuse AppointmentService,
  // no duplicated appointment logic". ----

  async createEvent(appointment: AppointmentDto): Promise<CalendarEventDto> {
    const { accessToken, calendarId } = await this.getValidAccessToken();
    try {
      const response = await firstValueFrom(
        this.httpService.post<GoogleEventResource>(
          `${this.googleConfig.apiUrl}/calendars/${encodeURIComponent(calendarId)}/events`,
          this.buildEventBody(appointment),
          { headers: authHeaders(accessToken), timeout: this.googleConfig.httpTimeoutMs },
        ),
      );
      return toEventDto(response.data, appointment.id);
    } catch (error) {
      throw describeGoogleCalendarError(error);
    }
  }

  async updateEvent(appointment: AppointmentDto, googleEventId: string): Promise<CalendarEventDto> {
    const { accessToken, calendarId } = await this.getValidAccessToken();
    try {
      const response = await firstValueFrom(
        this.httpService.patch<GoogleEventResource>(
          `${this.googleConfig.apiUrl}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
          this.buildEventBody(appointment),
          { headers: authHeaders(accessToken), timeout: this.googleConfig.httpTimeoutMs },
        ),
      );
      return toEventDto(response.data, appointment.id);
    } catch (error) {
      throw describeGoogleCalendarError(error);
    }
  }

  async deleteEvent(googleEventId: string): Promise<void> {
    const { accessToken, calendarId } = await this.getValidAccessToken();
    try {
      await firstValueFrom(
        this.httpService.delete(
          `${this.googleConfig.apiUrl}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
          { headers: authHeaders(accessToken), timeout: this.googleConfig.httpTimeoutMs },
        ),
      );
    } catch (error) {
      const described = describeGoogleCalendarError(error);
      // Google returns 404/410 for an event already gone on its side -
      // that's the outcome DELETE wanted anyway, so treat it as success.
      if (described.status === 410 || described.status === 404) {
        return;
      }
      throw described;
    }
  }

  async getEvent(googleEventId: string, appointmentId: string): Promise<CalendarEventDto> {
    const { accessToken, calendarId } = await this.getValidAccessToken();
    try {
      const response = await firstValueFrom(
        this.httpService.get<GoogleEventResource>(
          `${this.googleConfig.apiUrl}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
          { headers: authHeaders(accessToken), timeout: this.googleConfig.httpTimeoutMs },
        ),
      );
      return toEventDto(response.data, appointmentId);
    } catch (error) {
      throw describeGoogleCalendarError(error);
    }
  }

  /** GET /events/:appointmentId - looks up the appointment's currently-synced event id (GoogleCalendarRepository) then reads it live from Google; null if nothing has been synced yet. */
  async getEventForAppointment(appointmentId: string): Promise<CalendarEventDto | null> {
    const googleEventId = await this.googleCalendarRepository.findLatestGoogleEventId(appointmentId);
    if (!googleEventId) {
      return null;
    }
    return this.getEvent(googleEventId, appointmentId);
  }

  // ---- Sync history ----

  async listSyncHistory(query: QuerySyncHistoryDto): Promise<CalendarSyncLogDto[]> {
    const rows = await this.googleCalendarRepository.findSyncHistory(
      query.appointmentId ? { appointmentId: query.appointmentId } : {},
      query.limit ?? 50,
    );
    return rows.map((row) => ({
      id: row.id,
      appointmentId: row.appointmentId,
      googleEventId: row.googleEventId,
      operation: row.operation,
      status: row.status,
      errorMessage: row.errorMessage,
      syncedAt: row.syncedAt.toISOString(),
    }));
  }

  // ---- Internals ----

  private buildEventBody(appointment: AppointmentDto): object {
    return {
      summary: `Appointment - ${appointment.type}`,
      description: appointment.notes || `Patient ${appointment.patientId} with doctor ${appointment.doctorId}.`,
      start: { dateTime: `${appointment.date}T${appointment.startTime}:00`, timeZone: this.googleConfig.timezone },
      end: { dateTime: `${appointment.date}T${appointment.endTime}:00`, timeZone: this.googleConfig.timezone },
    };
  }

  /** Configured + not-expired access token, refreshing first if within TOKEN_REFRESH_SKEW_MS of expiry. */
  private async getValidAccessToken(): Promise<{ accessToken: string; calendarId: string }> {
    const connection = await this.requireConnection();
    const expiry = connection.tokenExpiry?.getTime() ?? 0;
    if (expiry - Date.now() > TOKEN_REFRESH_SKEW_MS) {
      return { accessToken: connection.accessToken, calendarId: connection.calendarId };
    }
    if (!connection.refreshToken) {
      throw new GoogleCalendarApiError(
        'Access token expired and no refresh token on file - reconnect the Google account.',
        null,
        'configuration_error',
        false,
      );
    }
    const refreshed = await this.exchangeRefreshToken(connection.id, connection.refreshToken);
    return { accessToken: refreshed.accessToken, calendarId: refreshed.calendarId };
  }

  private async exchangeRefreshToken(
    connectionId: string,
    refreshToken: string,
  ): Promise<GoogleCalendarConnection> {
    this.assertConfigured();
    try {
      const response = await firstValueFrom(
        this.httpService.post<TokenResponse>(
          this.googleConfig.tokenUrl,
          new URLSearchParams({
            refresh_token: refreshToken,
            client_id: this.googleConfig.clientId,
            client_secret: this.googleConfig.clientSecret,
            grant_type: 'refresh_token',
          }).toString(),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: this.googleConfig.httpTimeoutMs,
          },
        ),
      );
      const tokens = response.data;
      return await this.googleCalendarRepository.updateConnection(connectionId, {
        accessToken: tokens.access_token,
        tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        status: CalendarConnectionStatus.CONNECTED,
      });
    } catch (error) {
      await this.googleCalendarRepository.updateConnection(connectionId, {
        status: CalendarConnectionStatus.ERROR,
      });
      throw describeGoogleCalendarError(error);
    }
  }

  private async requireConnection(): Promise<GoogleCalendarConnection> {
    const connection = await this.googleCalendarRepository.findLatestConnection();
    if (!connection || connection.status === CalendarConnectionStatus.DISCONNECTED || !connection.accessToken) {
      throw new GoogleCalendarApiError(
        'Google Calendar is not connected - connect it from the Connection page first.',
        null,
        'configuration_error',
        false,
      );
    }
    return connection;
  }

  private assertConfigured(): void {
    if (!this.googleConfig.clientId || !this.googleConfig.clientSecret || !this.googleConfig.redirectUri) {
      throw new GoogleCalendarApiError(
        'GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REDIRECT_URI is not configured - set them in .env to enable Google Calendar.',
        null,
        'configuration_error',
        false,
      );
    }
  }
}

const DISCONNECTED_CONNECTION_DTO: CalendarConnectionDto = {
  connected: false,
  status: 'disconnected',
  calendarId: '',
  connectedEmail: '',
  tokenExpiry: null,
  lastSyncAt: null,
};

function authHeaders(accessToken: string): Record<string, string> {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };
}

function toConnectionDto(connection: GoogleCalendarConnection): CalendarConnectionDto {
  const notExpired = connection.tokenExpiry ? connection.tokenExpiry.getTime() > Date.now() : false;
  return {
    connected: connection.status === CalendarConnectionStatus.CONNECTED && (notExpired || !!connection.refreshToken),
    status: connection.status as CalendarConnectionDto['status'],
    calendarId: connection.calendarId,
    connectedEmail: connection.connectedEmail,
    tokenExpiry: connection.tokenExpiry ? connection.tokenExpiry.toISOString() : null,
    lastSyncAt: connection.lastSyncAt ? connection.lastSyncAt.toISOString() : null,
  };
}

function toEventDto(event: GoogleEventResource, appointmentId: string): CalendarEventDto {
  return {
    googleEventId: event.id,
    appointmentId,
    summary: event.summary ?? '',
    description: event.description ?? '',
    startTime: event.start?.dateTime ?? event.start?.date ?? '',
    endTime: event.end?.dateTime ?? event.end?.date ?? '',
    status: event.status ?? 'confirmed',
    htmlLink: event.htmlLink ?? null,
  };
}
