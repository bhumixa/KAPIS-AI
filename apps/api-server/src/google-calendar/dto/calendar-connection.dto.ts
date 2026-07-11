import { ApiProperty } from '@nestjs/swagger';

// GET/POST /api/google-calendar/connection* responses. Never carries the raw
// access/refresh token (clinic.google_calendar_connections.access_token/
// refresh_token) - those stay server-side, same "never return a secret you
// stored" rule WhatsappHealthDto/AiProviderHealthDto follow for their own
// configured tokens.
export class CalendarConnectionDto {
  @ApiProperty({ description: 'A real OAuth connection exists and its token has not expired without a refresh token to renew it.' })
  connected!: boolean;

  @ApiProperty({ enum: ['connected', 'disconnected', 'error'] })
  status!: 'connected' | 'disconnected' | 'error';

  @ApiProperty()
  calendarId!: string;

  @ApiProperty()
  connectedEmail!: string;

  @ApiProperty({ nullable: true })
  tokenExpiry!: string | null;

  @ApiProperty({ nullable: true })
  lastSyncAt!: string | null;
}
