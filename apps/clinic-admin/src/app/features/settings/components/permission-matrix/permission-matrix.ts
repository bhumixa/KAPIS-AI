import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import {
  PERMISSION_MODULE_LABELS,
  PermissionActions,
  RolePermission,
} from '../../models/permission.model';

export interface PermissionToggleEvent {
  permission: RolePermission;
  action: keyof PermissionActions;
  checked: boolean;
}

/**
 * Presentational View/Create/Update/Delete matrix for one role's permissions -
 * `RolesPermissions` owns which role is selected and talks to `UserService`;
 * this component only renders `RolePermission[]` and emits toggle events.
 */
@Component({
  selector: 'app-permission-matrix',
  imports: [MatCheckboxModule],
  templateUrl: './permission-matrix.html',
  styleUrl: './permission-matrix.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionMatrix {
  readonly permissions = input.required<RolePermission[]>();
  readonly isSaving = input(false);

  readonly permissionToggle = output<PermissionToggleEvent>();

  readonly moduleLabels = PERMISSION_MODULE_LABELS;

  onToggle(
    permission: RolePermission,
    action: keyof PermissionActions,
    event: MatCheckboxChange,
  ): void {
    this.permissionToggle.emit({ permission, action, checked: event.checked });
  }
}
