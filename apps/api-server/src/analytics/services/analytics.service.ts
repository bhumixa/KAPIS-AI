import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsHealthDto } from '../dto/analytics-health.dto';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';
import { SystemStatsDto } from '../dto/system-stats.dto';
import { ReportService } from './report.service';

/**
 * The Analytics module's top-level facade - the one provider its own
 * controller depends on for cross-cutting concerns (health, the System
 * Statistics page's single combined call). Per-metric work stays split
 * across DashboardAnalyticsService/ReportService/ExportService (see each
 * one's doc comment); this class composes ReportService's per-integration
 * reports for GET /api/analytics/system-stats so that page and the
 * individual /reports/* endpoints can never drift apart.
 */
@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportService: ReportService,
  ) {}

  async getHealth(): Promise<AnalyticsHealthDto> {
    const isDatabaseHealthy = await this.prisma.isDatabaseHealthy();
    return {
      status: isDatabaseHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      database: isDatabaseHealthy ? 'up' : 'down',
    };
  }

  async getSystemStats(query: AnalyticsQueryDto): Promise<SystemStatsDto> {
    const [automation, ai, whatsapp, googleCalendar, knowledgeBase, databaseHealthy] = await Promise.all([
      this.reportService.getAutomationAnalytics(query),
      this.reportService.getAiAnalytics(query),
      this.reportService.getWhatsappAnalytics(query),
      this.reportService.getGoogleCalendarAnalytics(query),
      this.reportService.getKnowledgeBaseAnalytics(),
      this.prisma.isDatabaseHealthy(),
    ]);

    return { automation, ai, whatsapp, googleCalendar, knowledgeBase, databaseHealthy };
  }
}
