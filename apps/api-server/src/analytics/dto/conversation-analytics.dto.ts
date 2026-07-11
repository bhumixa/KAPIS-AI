import { ApiProperty } from '@nestjs/swagger';
import { ChartSeriesDto } from './chart-series.dto';

/** GET /api/analytics/reports/conversations response - the Sprint 23 "Conversations" report. */
export class ConversationAnalyticsDto {
  @ApiProperty()
  totalConversations!: number;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, description: 'Count by ConversationDto.status.' })
  byStatus!: Record<string, number>;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, description: 'Count by ConversationDto.channel.' })
  byChannel!: Record<string, number>;

  @ApiProperty()
  unreadMessages!: number;

  @ApiProperty()
  chart!: ChartSeriesDto;
}
