import {
  AiAnalytics,
  AppointmentAnalytics,
  AutomationAnalytics,
  ChartSeries,
  ConversationAnalytics,
  DoctorAnalytics,
  GoogleCalendarAnalytics,
  KnowledgeBaseAnalytics,
  PatientAnalytics,
  RevenueAnalytics,
  WhatsappAnalytics,
} from '../../models/analytics-report.model';

export interface ReportStat {
  label: string;
  value: string | number;
}

export interface ReportBreakdown {
  title: string;
  entries: [string, number][];
}

export interface ReportTable {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

/**
 * The nine report DTOs each shape a different set of numbers/breakdowns/
 * tables around a different subject - normalizing every one of them into
 * this single view model here (rather than in the component) is what lets
 * reports.html stay one template instead of nine near-duplicates.
 */
export interface ReportView {
  stats: ReportStat[];
  breakdowns: ReportBreakdown[];
  chart?: ChartSeries;
  table?: ReportTable;
}

function toBreakdown(title: string, record: Record<string, number>): ReportBreakdown {
  return { title, entries: Object.entries(record) };
}

export function toAppointmentReportView(report: AppointmentAnalytics): ReportView {
  return {
    stats: [{ label: 'Total Appointments', value: report.totalAppointments }],
    breakdowns: [toBreakdown('By Status', report.byStatus), toBreakdown('By Type', report.byType)],
    chart: report.chart,
  };
}

export function toDoctorReportView(report: DoctorAnalytics): ReportView {
  return {
    stats: [
      { label: 'Total Doctors', value: report.totalDoctors },
      { label: 'Active Doctors', value: report.activeDoctors },
    ],
    breakdowns: [toBreakdown('By Specialization / Department', report.bySpecialization)],
    table: {
      title: 'Appointments by Doctor',
      columns: ['Doctor', 'Appointments'],
      rows: report.appointmentsByDoctor.map((d) => [d.doctorName, d.appointmentCount]),
    },
  };
}

export function toPatientReportView(report: PatientAnalytics): ReportView {
  return {
    stats: [
      { label: 'Total Patients', value: report.totalPatients },
      { label: 'Active Patients', value: report.activePatients },
    ],
    breakdowns: [toBreakdown('By Gender', report.byGender)],
    chart: report.newPatientsChart,
  };
}

export function toRevenueReportView(report: RevenueAnalytics): ReportView {
  return {
    stats: [{ label: 'Total Revenue', value: report.totalRevenue.toFixed(2) }],
    breakdowns: [],
    chart: report.chart,
    table: {
      title: 'Revenue by Doctor',
      columns: ['Doctor', 'Revenue', 'Completed Appointments'],
      rows: report.revenueByDoctor.map((d) => [d.doctorName, d.revenue.toFixed(2), d.completedAppointmentCount]),
    },
  };
}

export function toConversationReportView(report: ConversationAnalytics): ReportView {
  return {
    stats: [
      { label: 'Total Conversations', value: report.totalConversations },
      { label: 'Unread Messages', value: report.unreadMessages },
    ],
    breakdowns: [toBreakdown('By Status', report.byStatus), toBreakdown('By Channel', report.byChannel)],
    chart: report.chart,
  };
}

export function toAutomationReportView(report: AutomationAnalytics): ReportView {
  return {
    stats: [
      { label: 'Running', value: report.running },
      { label: 'Completed', value: report.completed },
      { label: 'Failed', value: report.failed },
      { label: 'Success Rate', value: `${report.successRatePercent}%` },
      { label: 'Average Runtime', value: `${report.averageRuntimeMs}ms` },
    ],
    breakdowns: [toBreakdown('By Trigger Source', report.byTriggerSource)],
  };
}

export function toAiReportView(report: AiAnalytics): ReportView {
  return {
    stats: [
      { label: 'Total Executions', value: report.totalExecutions },
      { label: 'Average Latency', value: `${report.averageLatencyMs}ms` },
      { label: 'Total Tokens', value: report.totalTokens },
      { label: 'Success Rate', value: `${report.successRatePercent}%` },
    ],
    breakdowns: [toBreakdown('By Provider', report.byProvider)],
    chart: report.chart,
  };
}

export function toWhatsappReportView(report: WhatsappAnalytics): ReportView {
  return {
    stats: [
      { label: 'Total Messages', value: report.totalMessages },
      { label: 'Incoming', value: report.incoming },
      { label: 'Outgoing', value: report.outgoing },
    ],
    breakdowns: [toBreakdown('By Message Type', report.byMessageType)],
    chart: report.chart,
  };
}

export function toGoogleCalendarReportView(report: GoogleCalendarAnalytics): ReportView {
  return {
    stats: [
      { label: 'Connected', value: report.connected ? 'Yes' : 'No' },
      { label: 'Total Synced Events', value: report.totalSyncedEvents },
      { label: 'Events Synced Today', value: report.eventsSyncedToday },
      { label: 'Success Rate', value: `${report.successRatePercent}%` },
    ],
    breakdowns: [toBreakdown('By Operation', report.byOperation)],
    chart: report.chart,
  };
}

export function toKnowledgeBaseReportView(report: KnowledgeBaseAnalytics): ReportView {
  return {
    stats: [{ label: 'Total Items', value: report.totalItems }],
    breakdowns: [toBreakdown('By Source', report.bySource)],
  };
}
