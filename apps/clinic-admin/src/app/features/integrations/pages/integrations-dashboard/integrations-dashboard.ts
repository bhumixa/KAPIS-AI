import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { IntegrationService } from '../../services/integration.service';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';
import { IntegrationsNav } from '../../components/integrations-nav/integrations-nav';
import { IntegrationStatusChip } from '../../components/integration-status-chip/integration-status-chip';

/** Status-only overview - no live API pings, just each integration's last-known state. */
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

  readonly whatsapp = this.integrationService.whatsapp;
  readonly claude = this.integrationService.claude;
  readonly googleCalendar = this.integrationService.googleCalendar;
  readonly webhookCount = this.integrationService.webhookCount;
  readonly activeWebhookCount = this.integrationService.activeWebhookCount;

  readonly routePaths = ROUTE_PATHS;
}
