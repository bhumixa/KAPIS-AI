import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';
import { ROUTE_PATHS } from '../../../core/constants/route-paths.constant';
import { getInitials } from '../../../core/utils/get-initials.util';

@Component({
  selector: 'app-toolbar',
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toolbar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /** Emitted when the mobile menu button is pressed; the layout owns the sidenav's open state. */
  readonly menuToggle = output<void>();

  readonly currentUser = this.authService.currentUser;

  get initials(): string {
    return getInitials(this.currentUser()?.name ?? '?');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate([ROUTE_PATHS.LOGIN]);
  }
}
