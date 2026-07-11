import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { IntegrationService } from '../../services/integration.service';
import { GoogleCalendarService } from '../../services/google-calendar.service';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';
import { IntegrationsNav } from '../../components/integrations-nav/integrations-nav';
import { IntegrationStatusChip } from '../../components/integration-status-chip/integration-status-chip';

/** Status-only overview - no live API pings for WhatsApp/Claude/Webhooks (still last-known mock state); Google Calendar (Sprint 22) reads the real connection signal instead. */
@Component({
  selector: 'app-integrations-dashboard',
  imports: [
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    IntegrationsNav,
    IntegrationStatusChip,
  ],
  templateUrl: './integrations-dashboard.html',
  styleUrl: './integrations-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntegrationsDashboard {
  private readonly integrationService = inject(IntegrationService);
  private readonly googleCalendarService = inject(GoogleCalendarService);

  readonly whatsapp = this.integrationService.whatsapp;
  readonly claude = this.integrationService.claude;
  readonly googleCalendar = this.googleCalendarService.connection;
  readonly webhookCount = this.integrationService.webhookCount;
  readonly activeWebhookCount = this.integrationService.activeWebhookCount;

  readonly routePaths = ROUTE_PATHS;
}
