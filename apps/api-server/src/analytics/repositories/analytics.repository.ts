import { Injectable } from '@nestjs/common';
import {
  AiExecutionHistory,
  Appointment,
  Conversation,
  Doctor,
  GoogleCalendarSyncEvent,
  Patient,
  Prisma,
  ReportExport,
  WhatsappMessage,
  WorkflowRuntimeExecution,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * The Sprint 23 "Repository Pattern" requirement - one repository for the
 * whole Analytics module, same "repository per module, not per table" shape
 * every other module (AppointmentsRepository, ConversationsRepository,
 * WhatsappRepository, ...) already uses. Unlike those, this repository reads
 * across tables several other modules own (clinic.appointments,
 * clinic.doctors, clinic.patients, clinic.conversations, clinic.messages,
 * clinic.workflow_runtime_executions, clinic.ai_execution_history,
 * clinic.whatsapp_messages, clinic.google_calendar_sync_events, plus the
 * knowledge-base source tables) - that is this module's whole job (reporting/
 * aggregation), and every query here is read-only. Nothing here reimplements
 * a business rule any of those modules own (booking validation, message
 * send/receive, AI orchestration, ...) - it only counts/sums/lists rows
 * those modules already wrote, the same "read access only, no CRUD module"
 * reasoning InsuranceProvider/AiPromptSetting/DoctorProfile's own Prisma
 * model doc comments already establish for cross-module reads. Only
 * `createReportExport` ever writes, to clinic.report_exports, the one table
 * this module owns outright.
 */
@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Appointments ----

  findAppointments(where: Prisma.AppointmentWhereInput): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({ where, orderBy: { appointmentDate: 'desc' } });
  }

  countAppointmentsByDate(date: Date): Promise<number> {
    return this.prisma.appointment.count({ where: { appointmentDate: date } });
  }

  countAppointments(where: Prisma.AppointmentWhereInput): Promise<number> {
    return this.prisma.appointment.count({ where });
  }

  // ---- Doctors ----

  findDoctors(where: Prisma.DoctorWhereInput = {}): Promise<Doctor[]> {
    return this.prisma.doctor.findMany({ where });
  }

  countDoctors(where: Prisma.DoctorWhereInput = {}): Promise<number> {
    return this.prisma.doctor.count({ where });
  }

  // ---- Patients ----

  findPatients(where: Prisma.PatientWhereInput = {}): Promise<Patient[]> {
    return this.prisma.patient.findMany({ where });
  }

  countPatients(where: Prisma.PatientWhereInput = {}): Promise<number> {
    return this.prisma.patient.count({ where });
  }

  // ---- Conversations & Messages ----

  findConversations(where: Prisma.ConversationWhereInput = {}): Promise<Conversation[]> {
    return this.prisma.conversation.findMany({ where });
  }

  countConversations(where: Prisma.ConversationWhereInput = {}): Promise<number> {
    return this.prisma.conversation.count({ where });
  }

  /** Global unread count across every conversation - ConversationsRepository.countUnread() is scoped to one conversation, this module needs the aggregate. */
  countUnreadMessages(): Promise<number> {
    return this.prisma.message.count({ where: { direction: 'incoming', read: false } });
  }

  // ---- Workflow Runtime (Sprint 21 end-to-end pipeline) ----

  async countWorkflowRuntimeByStatus(): Promise<{ running: number; completed: number; failed: number }> {
    const [running, completed, failed] = await Promise.all([
      this.prisma.workflowRuntimeExecution.count({ where: { status: 'RUNNING' } }),
      this.prisma.workflowRuntimeExecution.count({ where: { status: 'COMPLETED' } }),
      this.prisma.workflowRuntimeExecution.count({ where: { status: 'FAILED' } }),
    ]);
    return { running, completed, failed };
  }

  async averageWorkflowRuntimeDurationMs(where: Prisma.WorkflowRuntimeExecutionWhereInput = {}): Promise<number> {
    const result = await this.prisma.workflowRuntimeExecution.aggregate({
      where: { ...where, durationMs: { not: null } },
      _avg: { durationMs: true },
    });
    return Math.round(result._avg.durationMs ?? 0);
  }

  findWorkflowRuntimeExecutions(
    where: Prisma.WorkflowRuntimeExecutionWhereInput = {},
  ): Promise<WorkflowRuntimeExecution[]> {
    return this.prisma.workflowRuntimeExecution.findMany({ where, orderBy: { startedAt: 'desc' } });
  }

  // ---- AI ----

  async averageAiLatencyMs(where: Prisma.AiExecutionHistoryWhereInput = {}): Promise<number> {
    const result = await this.prisma.aiExecutionHistory.aggregate({
      where,
      _avg: { latencyMs: true },
    });
    return Math.round(result._avg.latencyMs ?? 0);
  }

  async sumAiTokens(where: Prisma.AiExecutionHistoryWhereInput = {}): Promise<number> {
    const result = await this.prisma.aiExecutionHistory.aggregate({
      where,
      _sum: { totalTokens: true },
    });
    return result._sum.totalTokens ?? 0;
  }

  findAiExecutions(where: Prisma.AiExecutionHistoryWhereInput = {}): Promise<AiExecutionHistory[]> {
    return this.prisma.aiExecutionHistory.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  countAiExecutions(where: Prisma.AiExecutionHistoryWhereInput = {}): Promise<number> {
    return this.prisma.aiExecutionHistory.count({ where });
  }

  // ---- WhatsApp ----

  findWhatsappMessages(where: Prisma.WhatsappMessageWhereInput = {}): Promise<WhatsappMessage[]> {
    return this.prisma.whatsappMessage.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  countWhatsappMessages(where: Prisma.WhatsappMessageWhereInput = {}): Promise<number> {
    return this.prisma.whatsappMessage.count({ where });
  }

  // ---- Google Calendar ----

  findGoogleCalendarSyncEvents(
    where: Prisma.GoogleCalendarSyncEventWhereInput = {},
  ): Promise<GoogleCalendarSyncEvent[]> {
    return this.prisma.googleCalendarSyncEvent.findMany({ where, orderBy: { syncedAt: 'desc' } });
  }

  countGoogleCalendarSyncEvents(where: Prisma.GoogleCalendarSyncEventWhereInput = {}): Promise<number> {
    return this.prisma.googleCalendarSyncEvent.count({ where });
  }

  async isGoogleCalendarConnected(): Promise<boolean> {
    const connection = await this.prisma.googleCalendarConnection.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    return connection?.status === 'connected';
  }

  // ---- Knowledge Base ----

  /**
   * One independent count per browsable source, same "tolerant of any single
   * source not existing yet" shape KnowledgeRepository.countIndexedDocuments()
   * uses - this module reads the same base tables, not RAG's search/ranking
   * internals, so it doesn't need to depend on that module at all.
   */
  async countKnowledgeBaseItems(): Promise<Record<string, number>> {
    const counters: [string, () => Promise<number>][] = [
      ['clinic_service', () => this.prisma.clinicService.count()],
      ['faq', () => this.prisma.faq.count()],
      ['policy', () => this.prisma.policy.count()],
      ['insurance_provider', () => this.prisma.insuranceProvider.count()],
      ['doctor_profile', () => this.prisma.doctorProfile.count()],
      ['message_template', () => this.prisma.messageTemplate.count()],
    ];
    const entries = await Promise.all(
      counters.map(async ([source, count]) => {
        try {
          return [source, await count()] as const;
        } catch {
          return [source, 0] as const;
        }
      }),
    );
    return Object.fromEntries(entries);
  }

  // ---- Report Exports (clinic.report_exports - this module's own table) ----

  createReportExport(data: Prisma.ReportExportCreateInput): Promise<ReportExport> {
    return this.prisma.reportExport.create({ data });
  }

  findRecentReportExports(limit: number): Promise<ReportExport[]> {
    return this.prisma.reportExport.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
  }
}
