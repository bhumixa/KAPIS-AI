import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { SystemStats } from '../../models/analytics-report.model';
import { AnalyticsService } from '../../services/analytics.service';

/**
 * Sprint 23 - the "System Statistics" page: one combined view of every
 * integration's health/throughput (Automation pipeline, AI, WhatsApp,
 * Google Calendar, Knowledge Base) plus database connectivity, sourced from
 * GET /api/analytics/system-stats. Automation already has its own detailed
 * dashboard (features/automation) - this page is the analytics-side summary
 * the Sprint 23 brief asks for, not a replacement for it.
 */
@Component({
  selector: 'app-system-statistics',
  imports: [MatCardModule, MatIconModule, MatChipsModule],
  templateUrl: './system-statistics.html',
  styleUrl: './system-statistics.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemStatistics implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);

  readonly stats = signal<SystemStats | null>(null);

  ngOnInit(): void {
    this.analyticsService.getSystemStats().subscribe((stats) => this.stats.set(stats));
  }
}
