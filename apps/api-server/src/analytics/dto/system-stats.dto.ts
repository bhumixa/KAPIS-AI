import { ApiProperty } from '@nestjs/swagger';
import { AiAnalyticsDto } from './ai-analytics.dto';
import { AutomationAnalyticsDto } from './automation-analytics.dto';
import { GoogleCalendarAnalyticsDto } from './google-calendar-analytics.dto';
import { KnowledgeBaseAnalyticsDto } from './knowledge-base-analytics.dto';
import { WhatsappAnalyticsDto } from './whatsapp-analytics.dto';

/** GET /api/analytics/system-stats response - the System Statistics page's single call, composing the same per-integration DTOs the individual /reports/* endpoints return so the two never drift apart. */
export class SystemStatsDto {
  @ApiProperty()
  automation!: AutomationAnalyticsDto;

  @ApiProperty()
  ai!: AiAnalyticsDto;

  @ApiProperty()
  whatsapp!: WhatsappAnalyticsDto;

  @ApiProperty()
  googleCalendar!: GoogleCalendarAnalyticsDto;

  @ApiProperty()
  knowledgeBase!: KnowledgeBaseAnalyticsDto;

  @ApiProperty()
  databaseHealthy!: boolean;
}
