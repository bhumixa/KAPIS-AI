import { Controller, Get, Headers, HttpCode, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CalendarConnectionDto } from './dto/calendar-connection.dto';
import { CalendarEventDto } from './dto/calendar-event.dto';
import { CalendarHealthDto } from './dto/calendar-health.dto';
import { CalendarStatsDto } from './dto/calendar-stats.dto';
import { CalendarSyncLogDto } from './dto/calendar-sync-log.dto';
import { OAuthCallbackQueryDto } from './dto/oauth-callback-query.dto';
import { QuerySyncHistoryDto } from './dto/query-sync-history.dto';
import { GoogleCalendarHealthService } from './services/google-calendar-health.service';
import { GoogleCalendarSyncService } from './services/google-calendar-sync.service';
import { GoogleCalendarWebhookService } from './services/google-calendar-webhook.service';
import { GoogleCalendarService } from './services/google-calendar.service';

// @Public() on every route, same escape hatch every other domain controller
// in this codebase uses (WhatsappController, WorkflowRuntimeController) - no
// login flow exists yet for the Angular app to send a real token with. The
// oauth/* routes are additionally driven by real browser navigations (the
// user clicking "Connect", Google redirecting back), not XHR - see each
// route's own comment.
@Public()
@ApiTags('google-calendar')
@Controller('google-calendar')
export class GoogleCalendarController {
  constructor(
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly googleCalendarSyncService: GoogleCalendarSyncService,
    private readonly googleCalendarWebhookService: GoogleCalendarWebhookService,
    private readonly googleCalendarHealthService: GoogleCalendarHealthService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Connection health: connected, calendarId, lastSync, provider' })
  getHealth(): Promise<CalendarHealthDto> {
    return this.googleCalendarHealthService.getHealth();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Automation Dashboard tiles: connection status, last sync, events synced today' })
  getStats(): Promise<CalendarStatsDto> {
    return this.googleCalendarHealthService.getStats();
  }

  @Get('connection')
  @ApiOperation({ summary: 'The current OAuth connection (never returns the raw access/refresh token)' })
  getConnection(): Promise<CalendarConnectionDto> {
    return this.googleCalendarService.getConnection();
  }

  @Get('oauth/connect')
  @ApiOperation({
    summary:
      "Redirects the browser to Google's OAuth 2.0 consent screen - the Angular Connection page navigates here directly (not via XHR) so Google's redirect lands back on GET /oauth/callback.",
  })
  connect(@Res() res: Response): void {
    res.redirect(this.googleCalendarService.getAuthUrl(crypto.randomUUID()));
  }

  @Get('oauth/callback')
  @ApiOperation({
    summary:
      "Google's OAuth redirect target - exchanges the authorization code for tokens, persists the connection, then redirects the browser back to the Angular Connection page.",
  })
  async callback(@Query() query: OAuthCallbackQueryDto, @Res() res: Response): Promise<void> {
    const redirectBase = this.googleCalendarService.getFrontendRedirectUrl();
    if (!query.code || query.error) {
      res.redirect(`${redirectBase}?connected=false&error=${encodeURIComponent(query.error ?? 'missing_code')}`);
      return;
    }
    try {
      await this.googleCalendarService.handleOAuthCallback(query.code);
      res.redirect(`${redirectBase}?connected=true`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown_error';
      res.redirect(`${redirectBase}?connected=false&error=${encodeURIComponent(message)}`);
    }
  }

  @Post('disconnect')
  @HttpCode(200)
  @ApiOperation({ summary: 'Revokes the stored connection - tokens are cleared, the row is kept for sync-history lookups' })
  async disconnect(): Promise<{ disconnected: true }> {
    await this.googleCalendarService.disconnect();
    return { disconnected: true };
  }

  @Post('refresh-token')
  @HttpCode(200)
  @ApiOperation({ summary: 'Forces an access-token refresh using the stored refresh token' })
  refreshToken(): Promise<CalendarConnectionDto> {
    return this.googleCalendarService.refreshToken();
  }

  @Get('events/:appointmentId')
  @ApiOperation({ summary: "Reads the appointment's currently-synced Google Calendar event, if any" })
  async getEvent(@Param('appointmentId') appointmentId: string): Promise<CalendarEventDto | null> {
    return this.googleCalendarService.getEventForAppointment(appointmentId);
  }

  @Post('sync/:appointmentId')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Manual Sync (Angular): re-runs the same create-or-update sync GoogleCalendarSyncService runs automatically off AppointmentsService events, on demand.',
  })
  async syncNow(@Param('appointmentId') appointmentId: string): Promise<{ synced: true }> {
    await this.googleCalendarSyncService.syncNow(appointmentId);
    return { synced: true };
  }

  @Get('sync-history')
  @ApiOperation({ summary: 'Sync History (Angular): recent create/update/delete/notify attempts, optionally filtered by appointment' })
  listSyncHistory(@Query() query: QuerySyncHistoryDto): Promise<CalendarSyncLogDto[]> {
    return this.googleCalendarService.listSyncHistory(query);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: "Google's push notification target (headers-only, no body) - registered as the watch channel's address" })
  async webhook(
    @Headers('x-goog-channel-id') channelId?: string,
    @Headers('x-goog-resource-id') resourceId?: string,
    @Headers('x-goog-resource-state') resourceState?: string,
    @Headers('x-goog-resource-uri') resourceUri?: string,
    @Headers('x-goog-message-number') messageNumber?: string,
  ): Promise<{ received: true }> {
    await this.googleCalendarWebhookService.handleNotification({
      channelId,
      resourceId,
      resourceState,
      resourceUri,
      messageNumber,
    });
    return { received: true };
  }
}
