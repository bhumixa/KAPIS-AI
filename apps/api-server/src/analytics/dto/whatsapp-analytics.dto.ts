import { ApiProperty } from '@nestjs/swagger';
import { ChartSeriesDto } from './chart-series.dto';

/** GET /api/analytics/reports/whatsapp response - clinic.whatsapp_messages stats, the Sprint 23 "WhatsApp" report. */
export class WhatsappAnalyticsDto {
  @ApiProperty()
  totalMessages!: number;

  @ApiProperty()
  incoming!: number;

  @ApiProperty()
  outgoing!: number;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, description: 'Count by WhatsappMessage.messageType.' })
  byMessageType!: Record<string, number>;

  @ApiProperty()
  chart!: ChartSeriesDto;
}
