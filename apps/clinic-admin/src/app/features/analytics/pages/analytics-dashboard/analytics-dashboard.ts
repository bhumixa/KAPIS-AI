import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MiniBarChart } from '../../components/mini-bar-chart/mini-bar-chart';
import { AppointmentAnalytics } from '../../models/analytics-report.model';
import { AnalyticsService } from '../../services/analytics.service';

interface StatTile {
  label: string;
  value: number;
  icon: string;
  accentVar: string;
  suffix?: string;
}

/**
 * Sprint 23 - the Analytics & Reporting module's landing page: every tile
 * the brief's "Dashboard Metrics" section names, sourced from
 * AnalyticsService.dashboardStats (GET /api/analytics/dashboard), plus an
 * Appointments trend chart (GET /api/analytics/reports/appointments) as the
 * page's one "Charts" example - Reports has the full per-report chart set.
 */
@Component({
  selector: 'app-analytics-dashboard',
  imports: [MatCardModule, MatIconModule, MiniBarChart],
  templateUrl: './analytics-dashboard.html',
  styleUrl: './analytics-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsDashboard implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);

  readonly dashboardStats = this.analyticsService.dashboardStats;
  readonly appointmentTrend = signal<AppointmentAnalytics | null>(null);

  readonly tiles = signal<StatTile[]>([]);

  ngOnInit(): void {
    this.analyticsService.getDashboardStats().subscribe((stats) => {
      this.tiles.set([
        { label: "Appointments Today", value: stats.appointmentsToday, icon: 'event', accentVar: '--mat-sys-primary' },
        { label: 'Upcoming Appointments', value: stats.upcomingAppointments, icon: 'upcoming', accentVar: '--mat-sys-primary' },
        { label: 'Completed Appointments', value: stats.completedAppointments, icon: 'task_alt', accentVar: '--kapis-color-success' },
        { label: 'Cancelled Appointments', value: stats.cancelledAppointments, icon: 'event_busy', accentVar: '--kapis-color-warning' },
        { label: 'Doctors', value: stats.doctors, icon: 'medical_services', accentVar: '--mat-sys-tertiary' },
        { label: 'Patients', value: stats.patients, icon: 'groups', accentVar: '--kapis-color-success' },
        { label: 'Active Conversations', value: stats.activeConversations, icon: 'forum', accentVar: '--kapis-color-warning' },
        { label: 'Unread Messages', value: stats.unreadMessages, icon: 'mark_chat_unread', accentVar: '--kapis-color-error' },
        { label: 'Running Workflows', value: stats.runningWorkflows, icon: 'sync', accentVar: '--mat-sys-primary' },
        { label: 'Completed Workflows', value: stats.completedWorkflows, icon: 'check_circle', accentVar: '--kapis-color-success' },
        { label: 'Failed Workflows', value: stats.failedWorkflows, icon: 'error', accentVar: '--kapis-color-error' },
        { label: 'AI Executions', value: stats.aiExecutions, icon: 'smart_toy', accentVar: '--mat-sys-tertiary' },
        { label: 'Average AI Latency', value: stats.averageAiLatencyMs, icon: 'speed', accentVar: '--mat-sys-tertiary', suffix: 'ms' },
        { label: 'WhatsApp Messages', value: stats.whatsappMessages, icon: 'chat', accentVar: '--mat-sys-primary' },
        { label: 'Google Calendar Events', value: stats.googleCalendarEvents, icon: 'calendar_month', accentVar: '--mat-sys-primary' },
        { label: 'Knowledge Base Items', value: stats.knowledgeBaseItems, icon: 'menu_book', accentVar: '--kapis-color-success' },
      ]);
    });

    this.analyticsService.getAppointmentReport({ granularity: 'daily' }).subscribe((report) => {
      this.appointmentTrend.set(report);
    });
  }
}
