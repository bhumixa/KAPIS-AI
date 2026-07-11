import { Body, Controller, Get, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { AiAnalyticsDto } from './dto/ai-analytics.dto';
import { AnalyticsHealthDto } from './dto/analytics-health.dto';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { AppointmentAnalyticsDto } from './dto/appointment-analytics.dto';
import { AutomationAnalyticsDto } from './dto/automation-analytics.dto';
import { ConversationAnalyticsDto } from './dto/conversation-analytics.dto';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { DoctorAnalyticsDto } from './dto/doctor-analytics.dto';
import { ExportReportDto } from './dto/export-report.dto';
import { GoogleCalendarAnalyticsDto } from './dto/google-calendar-analytics.dto';
import { KnowledgeBaseAnalyticsDto } from './dto/knowledge-base-analytics.dto';
import { PatientAnalyticsDto } from './dto/patient-analytics.dto';
import { ReportExportDto } from './dto/report-export.dto';
import { RevenueAnalyticsDto } from './dto/revenue-analytics.dto';
import { SystemStatsDto } from './dto/system-stats.dto';
import { WhatsappAnalyticsDto } from './dto/whatsapp-analytics.dto';
import { AnalyticsService } from './services/analytics.service';
import { DashboardAnalyticsService } from './services/dashboard-analytics.service';
import { ExportService } from './services/export.service';
import { ReportService } from './services/report.service';

// @Public() on every route - same escape hatch every other domain controller
// in this codebase uses (WorkflowRuntimeController, N8nController,
// WhatsappController, AiController) - no login flow exists yet for the
// Angular app to send a real token with. Entirely read-only except
// POST /export, which only ever writes an audit row to this module's own
// clinic.report_exports table - it never mutates anything Sprint 1-22 owns.
@Public()
@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly dashboardAnalyticsService: DashboardAnalyticsService,
    private readonly reportService: ReportService,
    private readonly exportService: ExportService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Liveness probe for the Analytics module - database connectivity only.' })
  getHealth(): Promise<AnalyticsHealthDto> {
    return this.analyticsService.getHealth();
  }

  @Get('dashboard')
  @ApiOperation({ summary: "Dashboard Analytics page: every tile in the Sprint 23 brief's Dashboard Metrics list." })
  getDashboard(): Promise<DashboardStatsDto> {
    return this.dashboardAnalyticsService.getDashboardStats();
  }

  @Get('system-stats')
  @ApiOperation({ summary: 'System Statistics page: Automation/AI/WhatsApp/Google Calendar/Knowledge Base stats plus database health, in one call.' })
  getSystemStats(@Query() query: AnalyticsQueryDto): Promise<SystemStatsDto> {
    return this.analyticsService.getSystemStats(query);
  }

  @Get('reports/appointments')
  @ApiOperation({ summary: 'Appointments report: totals, breakdown by status/type, and a chart series - filterable by date range/doctor/patient/status/department.' })
  getAppointmentReport(@Query() query: AnalyticsQueryDto): Promise<AppointmentAnalyticsDto> {
    return this.reportService.getAppointmentAnalytics(query);
  }

  @Get('reports/doctors')
  @ApiOperation({ summary: 'Doctors report: totals, breakdown by specialization/department, and appointment counts per doctor.' })
  getDoctorReport(@Query() query: AnalyticsQueryDto): Promise<DoctorAnalyticsDto> {
    return this.reportService.getDoctorAnalytics(query);
  }

  @Get('reports/patients')
  @ApiOperation({ summary: 'Patients report: totals, breakdown by gender, and a new-registrations chart series.' })
  getPatientReport(@Query() query: AnalyticsQueryDto): Promise<PatientAnalyticsDto> {
    return this.reportService.getPatientAnalytics(query);
  }

  @Get('reports/revenue')
  @ApiOperation({ summary: 'Revenue report: derived from completed appointments joined to each doctor\'s consultation fee (there is no billing module).' })
  getRevenueReport(@Query() query: AnalyticsQueryDto): Promise<RevenueAnalyticsDto> {
    return this.reportService.getRevenueAnalytics(query);
  }

  @Get('reports/conversations')
  @ApiOperation({ summary: 'Conversations report: totals, breakdown by status/channel, unread messages, and a chart series.' })
  getConversationReport(@Query() query: AnalyticsQueryDto): Promise<ConversationAnalyticsDto> {
    return this.reportService.getConversationAnalytics(query);
  }

  @Get('reports/automation')
  @ApiOperation({ summary: 'Automation report: Sprint 21 end-to-end pipeline running/completed/failed counts, success rate, and average runtime.' })
  getAutomationReport(@Query() query: AnalyticsQueryDto): Promise<AutomationAnalyticsDto> {
    return this.reportService.getAutomationAnalytics(query);
  }

  @Get('reports/ai')
  @ApiOperation({ summary: 'AI report: execution counts, average latency, token usage, success rate, and breakdown by provider.' })
  getAiReport(@Query() query: AnalyticsQueryDto): Promise<AiAnalyticsDto> {
    return this.reportService.getAiAnalytics(query);
  }

  @Get('reports/whatsapp')
  @ApiOperation({ summary: 'WhatsApp report: message counts by direction/type and a chart series.' })
  getWhatsappReport(@Query() query: AnalyticsQueryDto): Promise<WhatsappAnalyticsDto> {
    return this.reportService.getWhatsappAnalytics(query);
  }

  @Get('reports/google-calendar')
  @ApiOperation({ summary: 'Google Calendar report: connection status, sync counts by operation, and success rate.' })
  getGoogleCalendarReport(@Query() query: AnalyticsQueryDto): Promise<GoogleCalendarAnalyticsDto> {
    return this.reportService.getGoogleCalendarAnalytics(query);
  }

  @Get('reports/knowledge-base')
  @ApiOperation({ summary: 'Knowledge Base report: item counts by source table.' })
  getKnowledgeBaseReport(): Promise<KnowledgeBaseAnalyticsDto> {
    return this.reportService.getKnowledgeBaseAnalytics();
  }

  @Get('exports')
  @ApiOperation({ summary: 'Export history for the Exports page - most recent clinic.report_exports rows first.' })
  listExports(): Promise<ReportExportDto[]> {
    return this.exportService.listRecent();
  }

  @Post('export')
  @ApiOperation({ summary: 'Generate and download a report export (CSV/Excel/PDF), recording the attempt to clinic.report_exports.' })
  async export(@Body() dto: ExportReportDto, @Res() res: Response): Promise<void> {
    try {
      const result = await this.exportService.export(dto);
      res
        .status(HttpStatus.OK)
        .set({
          'Content-Type': result.contentType,
          'Content-Disposition': `attachment; filename="${result.fileName}"`,
        })
        .send(result.buffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error instanceof Error ? error.message : 'Export failed.',
      });
    }
  }
}
