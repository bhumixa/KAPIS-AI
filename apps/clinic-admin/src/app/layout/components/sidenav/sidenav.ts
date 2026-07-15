import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { SIDENAV_ITEMS } from '../../../core/constants/nav-items.constant';
import { NavItem } from '../../../core/models/nav-item.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidenav',
  imports: [RouterLink, RouterLinkActive, MatListModule, MatIconModule],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidenav {
  private readonly authService = inject(AuthService);

  /**
   * Drops any item (top-level or nested child) whose `roles` list excludes
   * the current user's role. A parent left with an empty `children` array
   * (every child role-gated away) is dropped too, since it would otherwise
   * render as an empty, unclickable group label.
   */
  readonly navItems = computed(() => {
    const role = this.authService.currentUser()?.role;
    const isVisible = (item: NavItem) => !item.roles || (!!role && item.roles.includes(role));

    return SIDENAV_ITEMS.filter(isVisible)
      .map((item) => (item.children ? { ...item, children: item.children.filter(isVisible) } : item))
      .filter((item) => !item.children || item.children.length > 0);
  });
}
