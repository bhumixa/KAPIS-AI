import { ChartGranularity } from './analytics-query.model';

/** Mirrors apps/api-server's ChartPointDto/ChartSeriesDto. */
export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartSeries {
  granularity: ChartGranularity;
  points: ChartPoint[];
}

/** Mirrors apps/api-server's AppointmentAnalyticsDto. */
export interface AppointmentAnalytics {
  totalAppointments: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  chart: ChartSeries;
}

export interface DoctorAppointmentCount {
  doctorId: string;
  doctorName: string;
  appointmentCount: number;
}

/** Mirrors apps/api-server's DoctorAnalyticsDto. */
export interface DoctorAnalytics {
  totalDoctors: number;
  activeDoctors: number;
  bySpecialization: Record<string, number>;
  appointmentsByDoctor: DoctorAppointmentCount[];
}

/** Mirrors apps/api-server's PatientAnalyticsDto. */
export interface PatientAnalytics {
  totalPatients: number;
  activePatients: number;
  byGender: Record<string, number>;
  newPatientsChart: ChartSeries;
}

export interface DoctorRevenue {
  doctorId: string;
  doctorName: string;
  revenue: number;
  completedAppointmentCount: number;
}

/** Mirrors apps/api-server's RevenueAnalyticsDto. */
export interface RevenueAnalytics {
  totalRevenue: number;
  revenueByDoctor: DoctorRevenue[];
  chart: ChartSeries;
}

/** Mirrors apps/api-server's ConversationAnalyticsDto. */
export interface ConversationAnalytics {
  totalConversations: number;
  byStatus: Record<string, number>;
  byChannel: Record<string, number>;
  unreadMessages: number;
  chart: ChartSeries;
}

/** Mirrors apps/api-server's AutomationAnalyticsDto. */
export interface AutomationAnalytics {
  running: number;
  completed: number;
  failed: number;
  successRatePercent: number;
  averageRuntimeMs: number;
  byTriggerSource: Record<string, number>;
}

/** Mirrors apps/api-server's AiAnalyticsDto. */
export interface AiAnalytics {
  totalExecutions: number;
  averageLatencyMs: number;
  totalTokens: number;
  successRatePercent: number;
  byProvider: Record<string, number>;
  chart: ChartSeries;
}

/** Mirrors apps/api-server's WhatsappAnalyticsDto. */
export interface WhatsappAnalytics {
  totalMessages: number;
  incoming: number;
  outgoing: number;
  byMessageType: Record<string, number>;
  chart: ChartSeries;
}

/** Mirrors apps/api-server's GoogleCalendarAnalyticsDto. */
export interface GoogleCalendarAnalytics {
  connected: boolean;
  totalSyncedEvents: number;
  eventsSyncedToday: number;
  byOperation: Record<string, number>;
  successRatePercent: number;
  chart: ChartSeries;
}

/** Mirrors apps/api-server's KnowledgeBaseAnalyticsDto. */
export interface KnowledgeBaseAnalytics {
  totalItems: number;
  bySource: Record<string, number>;
}

/** Mirrors apps/api-server's SystemStatsDto - GET /analytics/system-stats. */
export interface SystemStats {
  automation: AutomationAnalytics;
  ai: AiAnalytics;
  whatsapp: WhatsappAnalytics;
  googleCalendar: GoogleCalendarAnalytics;
  knowledgeBase: KnowledgeBaseAnalytics;
  databaseHealthy: boolean;
}
