import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isoDateToDate } from '../../common/utils/date-time.util';
import { AiAnalyticsDto } from '../dto/ai-analytics.dto';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';
import { AppointmentAnalyticsDto } from '../dto/appointment-analytics.dto';
import { AutomationAnalyticsDto } from '../dto/automation-analytics.dto';
import { ConversationAnalyticsDto } from '../dto/conversation-analytics.dto';
import { DoctorAnalyticsDto, DoctorAppointmentCountDto } from '../dto/doctor-analytics.dto';
import { GoogleCalendarAnalyticsDto } from '../dto/google-calendar-analytics.dto';
import { KnowledgeBaseAnalyticsDto } from '../dto/knowledge-base-analytics.dto';
import { PatientAnalyticsDto } from '../dto/patient-analytics.dto';
import { RevenueAnalyticsDto } from '../dto/revenue-analytics.dto';
import { WhatsappAnalyticsDto } from '../dto/whatsapp-analytics.dto';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { bucketIntoChartSeries } from '../utils/chart-bucket.util';
import { dateRangeFilter } from '../utils/date-range.util';

/**
 * Builds the nine GET /api/analytics/reports/* responses the Sprint 23 brief's
 * "Reports" section names, applying the shared filter set ("Filters" section:
 * Date Range, Doctor, Patient, Status, Department) each report supports.
 * Every method fetches rows via AnalyticsRepository, then groups/aggregates
 * them here in plain JS - the same split AnalyticsRepository's own doc
 * comment describes for DashboardAnalyticsService. `department` has no
 * dedicated column anywhere in the schema, so appointment/doctor reports
 * resolve it against Doctor.specialization first (see resolveDepartmentDoctorIds()).
 */
@Injectable()
export class ReportService {
  constructor(private readonly repository: AnalyticsRepository) {}

  async getAppointmentAnalytics(query: AnalyticsQueryDto): Promise<AppointmentAnalyticsDto> {
    const where = await this.buildAppointmentWhere(query);
    const appointments = await this.repository.findAppointments(where);

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    for (const appointment of appointments) {
      byStatus[appointment.status] = (byStatus[appointment.status] ?? 0) + 1;
      byType[appointment.appointmentType] = (byType[appointment.appointmentType] ?? 0) + 1;
    }

    return {
      totalAppointments: appointments.length,
      byStatus,
      byType,
      chart: {
        granularity: query.granularity ?? 'daily',
        points: bucketIntoChartSeries(
          appointments.map((appointment) => appointment.appointmentDate),
          query.granularity ?? 'daily',
        ),
      },
    };
  }

  async getDoctorAnalytics(query: AnalyticsQueryDto): Promise<DoctorAnalyticsDto> {
    const doctorWhere: Prisma.DoctorWhereInput = {
      ...(query.doctorId ? { id: query.doctorId } : {}),
      ...(query.department ? { specialization: query.department } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const doctors = await this.repository.findDoctors(doctorWhere);

    const bySpecialization: Record<string, number> = {};
    for (const doctor of doctors) {
      bySpecialization[doctor.specialization] = (bySpecialization[doctor.specialization] ?? 0) + 1;
    }

    const appointmentWhere = await this.buildAppointmentWhere(query);
    const appointments = await this.repository.findAppointments(appointmentWhere);
    const countByDoctorId = new Map<string, number>();
    for (const appointment of appointments) {
      countByDoctorId.set(appointment.doctorId, (countByDoctorId.get(appointment.doctorId) ?? 0) + 1);
    }

    const appointmentsByDoctor: DoctorAppointmentCountDto[] = doctors
      .map((doctor) => ({
        doctorId: doctor.id,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        appointmentCount: countByDoctorId.get(doctor.id) ?? 0,
      }))
      .sort((a, b) => b.appointmentCount - a.appointmentCount);

    return {
      totalDoctors: doctors.length,
      activeDoctors: doctors.filter((doctor) => doctor.status === 'active').length,
      bySpecialization,
      appointmentsByDoctor,
    };
  }

  async getPatientAnalytics(query: AnalyticsQueryDto): Promise<PatientAnalyticsDto> {
    const where: Prisma.PatientWhereInput = {
      ...(query.patientId ? { id: query.patientId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(dateRangeFilter(query) ? { createdAt: dateRangeFilter(query) } : {}),
    };
    const patients = await this.repository.findPatients(where);

    const byGender: Record<string, number> = {};
    for (const patient of patients) {
      byGender[patient.gender] = (byGender[patient.gender] ?? 0) + 1;
    }

    return {
      totalPatients: patients.length,
      activePatients: patients.filter((patient) => patient.status === 'active').length,
      byGender,
      newPatientsChart: {
        granularity: query.granularity ?? 'daily',
        points: bucketIntoChartSeries(
          patients.map((patient) => patient.createdAt),
          query.granularity ?? 'daily',
        ),
      },
    };
  }

  async getRevenueAnalytics(query: AnalyticsQueryDto): Promise<RevenueAnalyticsDto> {
    const appointmentWhere = await this.buildAppointmentWhere(query);
    const [appointments, doctors] = await Promise.all([
      this.repository.findAppointments({ ...appointmentWhere, status: 'completed' }),
      this.repository.findDoctors(),
    ]);
    const feeByDoctorId = new Map(doctors.map((doctor) => [doctor.id, Number(doctor.consultationFee)]));
    const nameByDoctorId = new Map(
      doctors.map((doctor) => [doctor.id, `${doctor.firstName} ${doctor.lastName}`]),
    );

    const revenueByDoctorId = new Map<string, { revenue: number; count: number }>();
    for (const appointment of appointments) {
      const fee = feeByDoctorId.get(appointment.doctorId) ?? 0;
      const entry = revenueByDoctorId.get(appointment.doctorId) ?? { revenue: 0, count: 0 };
      entry.revenue += fee;
      entry.count += 1;
      revenueByDoctorId.set(appointment.doctorId, entry);
    }

    const revenueByDoctor = [...revenueByDoctorId.entries()]
      .map(([doctorId, entry]) => ({
        doctorId,
        doctorName: nameByDoctorId.get(doctorId) ?? 'Unknown',
        revenue: entry.revenue,
        completedAppointmentCount: entry.count,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue: revenueByDoctor.reduce((sum, entry) => sum + entry.revenue, 0),
      revenueByDoctor,
      chart: {
        granularity: query.granularity ?? 'daily',
        points: bucketIntoChartSeries(
          appointments.map((appointment) => appointment.appointmentDate),
          query.granularity ?? 'daily',
        ),
      },
    };
  }

  async getConversationAnalytics(query: AnalyticsQueryDto): Promise<ConversationAnalyticsDto> {
    const where: Prisma.ConversationWhereInput = {
      ...(query.patientId ? { patientId: query.patientId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(dateRangeFilter(query) ? { createdAt: dateRangeFilter(query) } : {}),
    };
    const [conversations, unreadMessages] = await Promise.all([
      this.repository.findConversations(where),
      this.repository.countUnreadMessages(),
    ]);

    const byStatus: Record<string, number> = {};
    const byChannel: Record<string, number> = {};
    for (const conversation of conversations) {
      byStatus[conversation.status] = (byStatus[conversation.status] ?? 0) + 1;
      byChannel[conversation.channel] = (byChannel[conversation.channel] ?? 0) + 1;
    }

    return {
      totalConversations: conversations.length,
      byStatus,
      byChannel,
      unreadMessages,
      chart: {
        granularity: query.granularity ?? 'daily',
        points: bucketIntoChartSeries(
          conversations.map((conversation) => conversation.createdAt),
          query.granularity ?? 'daily',
        ),
      },
    };
  }

  async getAutomationAnalytics(query: AnalyticsQueryDto): Promise<AutomationAnalyticsDto> {
    const where: Prisma.WorkflowRuntimeExecutionWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(dateRangeFilter(query) ? { startedAt: dateRangeFilter(query) } : {}),
    };
    const [statusCounts, averageRuntimeMs, executions] = await Promise.all([
      this.repository.countWorkflowRuntimeByStatus(),
      this.repository.averageWorkflowRuntimeDurationMs(where),
      this.repository.findWorkflowRuntimeExecutions(where),
    ]);

    const byTriggerSource: Record<string, number> = {};
    for (const execution of executions) {
      byTriggerSource[execution.triggerSource] = (byTriggerSource[execution.triggerSource] ?? 0) + 1;
    }

    const finished = statusCounts.completed + statusCounts.failed;
    const successRatePercent = finished === 0 ? 100 : Math.round((statusCounts.completed / finished) * 100);

    return {
      running: statusCounts.running,
      completed: statusCounts.completed,
      failed: statusCounts.failed,
      successRatePercent,
      averageRuntimeMs,
      byTriggerSource,
    };
  }

  async getAiAnalytics(query: AnalyticsQueryDto): Promise<AiAnalyticsDto> {
    const where: Prisma.AiExecutionHistoryWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(dateRangeFilter(query) ? { createdAt: dateRangeFilter(query) } : {}),
    };
    const [executions, averageLatencyMs, totalTokens] = await Promise.all([
      this.repository.findAiExecutions(where),
      this.repository.averageAiLatencyMs(where),
      this.repository.sumAiTokens(where),
    ]);

    const byProvider: Record<string, number> = {};
    let successCount = 0;
    for (const execution of executions) {
      byProvider[execution.provider] = (byProvider[execution.provider] ?? 0) + 1;
      if (execution.status === 'success') {
        successCount += 1;
      }
    }

    return {
      totalExecutions: executions.length,
      averageLatencyMs,
      totalTokens,
      successRatePercent: executions.length === 0 ? 100 : Math.round((successCount / executions.length) * 100),
      byProvider,
      chart: {
        granularity: query.granularity ?? 'daily',
        points: bucketIntoChartSeries(
          executions.map((execution) => execution.createdAt),
          query.granularity ?? 'daily',
        ),
      },
    };
  }

  async getWhatsappAnalytics(query: AnalyticsQueryDto): Promise<WhatsappAnalyticsDto> {
    const where: Prisma.WhatsappMessageWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(dateRangeFilter(query) ? { createdAt: dateRangeFilter(query) } : {}),
    };
    const messages = await this.repository.findWhatsappMessages(where);

    const byMessageType: Record<string, number> = {};
    let incoming = 0;
    let outgoing = 0;
    for (const message of messages) {
      byMessageType[message.messageType] = (byMessageType[message.messageType] ?? 0) + 1;
      if (message.direction === 'incoming') {
        incoming += 1;
      } else {
        outgoing += 1;
      }
    }

    return {
      totalMessages: messages.length,
      incoming,
      outgoing,
      byMessageType,
      chart: {
        granularity: query.granularity ?? 'daily',
        points: bucketIntoChartSeries(
          messages.map((message) => message.createdAt),
          query.granularity ?? 'daily',
        ),
      },
    };
  }

  async getGoogleCalendarAnalytics(query: AnalyticsQueryDto): Promise<GoogleCalendarAnalyticsDto> {
    const where: Prisma.GoogleCalendarSyncEventWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(dateRangeFilter(query) ? { syncedAt: dateRangeFilter(query) } : {}),
    };
    const [events, connected, eventsSyncedToday] = await Promise.all([
      this.repository.findGoogleCalendarSyncEvents(where),
      this.repository.isGoogleCalendarConnected(),
      this.repository.countGoogleCalendarSyncEvents({
        status: 'SUCCESS',
        syncedAt: { gte: isoDateToDate(new Date().toISOString().slice(0, 10)) },
      }),
    ]);

    const byOperation: Record<string, number> = {};
    let success = 0;
    for (const event of events) {
      byOperation[event.operation] = (byOperation[event.operation] ?? 0) + 1;
      if (event.status === 'SUCCESS') {
        success += 1;
      }
    }

    return {
      connected,
      totalSyncedEvents: events.length,
      eventsSyncedToday,
      byOperation,
      successRatePercent: events.length === 0 ? 100 : Math.round((success / events.length) * 100),
      chart: {
        granularity: query.granularity ?? 'daily',
        points: bucketIntoChartSeries(
          events.map((event) => event.syncedAt),
          query.granularity ?? 'daily',
        ),
      },
    };
  }

  async getKnowledgeBaseAnalytics(): Promise<KnowledgeBaseAnalyticsDto> {
    const bySource = await this.repository.countKnowledgeBaseItems();
    return {
      totalItems: Object.values(bySource).reduce((sum, count) => sum + count, 0),
      bySource,
    };
  }

  // ---- Shared filter helpers ----

  /** `department` maps onto Doctor.specialization (see AnalyticsQueryDto's doc comment) - resolved here since Appointment has no specialization column of its own. */
  private async buildAppointmentWhere(query: AnalyticsQueryDto): Promise<Prisma.AppointmentWhereInput> {
    const dateRange = dateRangeFilter(query);
    let doctorIdIn: string[] | undefined;
    if (query.department) {
      const doctors = await this.repository.findDoctors({ specialization: query.department });
      doctorIdIn = doctors.map((doctor) => doctor.id);
    }

    return {
      ...(query.patientId ? { patientId: query.patientId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(dateRange ? { appointmentDate: dateRange } : {}),
      // `doctorId` (more specific) always wins over a `department`-derived
      // id list - spread order matters here since both target the same key.
      ...(doctorIdIn ? { doctorId: { in: doctorIdIn } } : {}),
      ...(query.doctorId ? { doctorId: query.doctorId } : {}),
    };
  }
}
