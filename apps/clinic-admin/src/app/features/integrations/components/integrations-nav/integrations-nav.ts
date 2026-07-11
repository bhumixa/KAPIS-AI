import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

interface IntegrationsNavLink {
  label: string;
  path: string;
  exact: boolean;
}

/** Small sub-nav shared by all five integrations screens, same shape as `KnowledgeBaseNav`. */
@Component({
  selector: 'app-integrations-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './integrations-nav.html',
  styleUrl: './integrations-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntegrationsNav {
  readonly links: IntegrationsNavLink[] = [
    { label: 'Overview', path: `${ROUTE_PATHS.INTEGRATIONS}`, exact: true },
    { label: 'WhatsApp', path: `${ROUTE_PATHS.INTEGRATIONS}/whatsapp`, exact: false },
    { label: 'Gemini AI', path: `${ROUTE_PATHS.INTEGRATIONS}/claude`, exact: false },
    {
      label: 'Google Calendar',
      path: `${ROUTE_PATHS.INTEGRATIONS}/google-calendar`,
      exact: false,
    },
    { label: 'Webhooks', path: `${ROUTE_PATHS.INTEGRATIONS}/webhooks`, exact: false },
  ];
}
