import { ApiProperty } from '@nestjs/swagger';

/** GET /api/analytics/dashboard response - every tile the Sprint 23 brief's "Dashboard Metrics" section names. */
export class DashboardStatsDto {
  @ApiProperty()
  appointmentsToday!: number;

  @ApiProperty()
  upcomingAppointments!: number;

  @ApiProperty()
  completedAppointments!: number;

  @ApiProperty()
  cancelledAppointments!: number;

  @ApiProperty()
  doctors!: number;

  @ApiProperty()
  patients!: number;

  @ApiProperty()
  activeConversations!: number;

  @ApiProperty()
  unreadMessages!: number;

  @ApiProperty()
  runningWorkflows!: number;

  @ApiProperty()
  completedWorkflows!: number;

  @ApiProperty()
  failedWorkflows!: number;

  @ApiProperty()
  aiExecutions!: number;

  @ApiProperty()
  averageAiLatencyMs!: number;

  @ApiProperty()
  whatsappMessages!: number;

  @ApiProperty()
  googleCalendarEvents!: number;

  @ApiProperty()
  knowledgeBaseItems!: number;
}
