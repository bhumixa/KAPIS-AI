/** Mirrors apps/api-server's DashboardStatsDto - GET /analytics/dashboard. */
export interface DashboardStats {
  appointmentsToday: number;
  upcomingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  doctors: number;
  patients: number;
  activeConversations: number;
  unreadMessages: number;
  runningWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  aiExecutions: number;
  averageAiLatencyMs: number;
  whatsappMessages: number;
  googleCalendarEvents: number;
  knowledgeBaseItems: number;
}
