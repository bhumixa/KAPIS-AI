import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole } from '../../../../core/models/user.model';

interface KnowledgeBaseNavLink {
  label: string;
  path: string;
  exact: boolean;
  /** Omitted means visible to every role; otherwise only shown to the roles listed. */
  roles?: UserRole[];
}

/** Small sub-nav shared by all knowledge-base screens, same shape as `SettingsNav`. */
@Component({
  selector: 'app-knowledge-base-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './knowledge-base-nav.html',
  styleUrl: './knowledge-base-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBaseNav {
  private readonly authService = inject(AuthService);

  private readonly allLinks: KnowledgeBaseNavLink[] = [
    { label: 'Services', path: `${ROUTE_PATHS.KNOWLEDGE_BASE}`, exact: true },
    { label: 'FAQs', path: `${ROUTE_PATHS.KNOWLEDGE_BASE}/faqs`, exact: false },
    {
      label: 'Doctor Profiles',
      path: `${ROUTE_PATHS.KNOWLEDGE_BASE}/doctor-profiles`,
      exact: false,
    },
    { label: 'Policies', path: `${ROUTE_PATHS.KNOWLEDGE_BASE}/policies`, exact: false },
    {
      label: 'Message Templates',
      path: `${ROUTE_PATHS.KNOWLEDGE_BASE}/message-templates`,
      exact: false,
    },
    {
      label: 'AI Prompt Settings',
      path: `${ROUTE_PATHS.KNOWLEDGE_BASE}/ai-prompt-settings`,
      exact: false,
      roles: ['developer'],
    },
  ];

  readonly links = computed(() => {
    const role = this.authService.currentUser()?.role;
    return this.allLinks.filter((link) => !link.roles || (!!role && link.roles.includes(role)));
  });
}
