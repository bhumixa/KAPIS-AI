import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

interface KnowledgeBaseNavLink {
  label: string;
  path: string;
  exact: boolean;
}

/** Small sub-nav shared by all seven knowledge-base screens, same shape as `SettingsNav`. */
@Component({
  selector: 'app-knowledge-base-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './knowledge-base-nav.html',
  styleUrl: './knowledge-base-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBaseNav {
  readonly links: KnowledgeBaseNavLink[] = [
    { label: 'Services', path: `${ROUTE_PATHS.KNOWLEDGE_BASE}`, exact: true },
    { label: 'FAQs', path: `${ROUTE_PATHS.KNOWLEDGE_BASE}/faqs`, exact: false },
    {
      label: 'Doctor Profiles',
      path: `${ROUTE_PATHS.KNOWLEDGE_BASE}/doctor-profiles`,
      exact: false,
    },
    { label: 'Policies', path: `${ROUTE_PATHS.KNOWLEDGE_BASE}/policies`, exact: false },
    {
      label: 'Insurance Providers',
      path: `${ROUTE_PATHS.KNOWLEDGE_BASE}/insurance-providers`,
      exact: false,
    },
    {
      label: 'Message Templates',
      path: `${ROUTE_PATHS.KNOWLEDGE_BASE}/message-templates`,
      exact: false,
    },
    {
      label: 'AI Prompt Settings',
      path: `${ROUTE_PATHS.KNOWLEDGE_BASE}/ai-prompt-settings`,
      exact: false,
    },
  ];
}
