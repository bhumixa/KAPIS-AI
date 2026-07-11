import { Injectable } from '@nestjs/common';
import { isoDateToDate } from '../../common/utils/date-time.util';
import { DashboardStatsDto } from '../dto/dashboard-stats.dto';
import { AnalyticsRepository } from '../repositories/analytics.repository';

function startOfToday(): Date {
  return isoDateToDate(new Date().toISOString().slice(0, 10));
}

/**
 * Composes AnalyticsRepository's counts into the single GET /api/analytics/dashboard
 * response - the Sprint 23 brief's "Dashboard Metrics" tile list, mirroring
 * apps/clinic-admin's existing Dashboard summary cards' "today" scoping for
 * appointmentsToday/completedAppointments/cancelledAppointments (see
 * AppointmentService.todaysAppointmentCount()/completedTodayCount()/
 * cancelledTodayCount()) so the two pages never disagree on what "today"
 * means. Every figure here is a plain read - no writes, no business rules.
 */
@Injectable()
export class DashboardAnalyticsService {
  constructor(private readonly repository: AnalyticsRepository) {}

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const today = startOfToday();

    const [
      appointmentsToday,
      upcomingAppointments,
      completedAppointments,
      cancelledAppointments,
      doctors,
      patients,
      activeConversations,
      unreadMessages,
      workflowStatusCounts,
      aiExecutions,
      averageAiLatencyMs,
      whatsappMessages,
      googleCalendarEvents,
      knowledgeBaseCounts,
    ] = await Promise.all([
      this.repository.countAppointmentsByDate(today),
      this.repository.countAppointments({ appointmentDate: { gt: today }, status: 'scheduled' }),
      this.repository.countAppointments({ appointmentDate: today, status: 'completed' }),
      this.repository.countAppointments({ appointmentDate: today, status: 'cancelled' }),
      this.repository.countDoctors(),
      this.repository.countPatients(),
      this.repository.countConversations({ status: { not: 'closed' } }),
      this.repository.countUnreadMessages(),
      this.repository.countWorkflowRuntimeByStatus(),
      this.repository.countAiExecutions(),
      this.repository.averageAiLatencyMs(),
      this.repository.countWhatsappMessages(),
      this.repository.countGoogleCalendarSyncEvents({ status: 'SUCCESS' }),
      this.repository.countKnowledgeBaseItems(),
    ]);

    return {
      appointmentsToday,
      upcomingAppointments,
      completedAppointments,
      cancelledAppointments,
      doctors,
      patients,
      activeConversations,
      unreadMessages,
      runningWorkflows: workflowStatusCounts.running,
      completedWorkflows: workflowStatusCounts.completed,
      failedWorkflows: workflowStatusCounts.failed,
      aiExecutions,
      averageAiLatencyMs,
      whatsappMessages,
      googleCalendarEvents,
      knowledgeBaseItems: Object.values(knowledgeBaseCounts).reduce((sum, count) => sum + count, 0),
    };
  }
}
