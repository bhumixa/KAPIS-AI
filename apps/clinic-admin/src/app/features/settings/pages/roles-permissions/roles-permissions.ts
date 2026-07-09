import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../services/user.service';
import { UserRole } from '../../models/clinic-user.model';
import { SettingsNav } from '../../components/settings-nav/settings-nav';
import {
  PermissionMatrix,
  PermissionToggleEvent,
} from '../../components/permission-matrix/permission-matrix';

@Component({
  selector: 'app-roles-permissions',
  imports: [MatButtonToggleModule, TitleCasePipe, SettingsNav, PermissionMatrix],
  templateUrl: './roles-permissions.html',
  styleUrl: './roles-permissions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesPermissions {
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);

  readonly roles = this.userService.roles;
  readonly selectedRole = signal<UserRole>('admin');
  readonly isSaving = signal(false);

  readonly permissions = computed(() => {
    // Reads the rolePermissions signal (not just the sync getter) so this
    // recomputes after a save updates the underlying signal.
    this.userService.rolePermissions();
    return this.userService.getRolePermissions(this.selectedRole());
  });

  selectRole(role: UserRole): void {
    this.selectedRole.set(role);
  }

  onToggle(event: PermissionToggleEvent): void {
    const updatedActions = { ...event.permission.actions, [event.action]: event.checked };
    this.isSaving.set(true);

    this.userService
      .updateRolePermission(event.permission.role, event.permission.module, updatedActions)
      .subscribe(() => {
        this.isSaving.set(false);
        this.snackBar.open('Permission updated.', 'Dismiss', { duration: 2000 });
      });
  }
}
