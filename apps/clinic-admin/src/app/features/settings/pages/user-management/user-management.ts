import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../services/user.service';
import { ClinicUser, ClinicUserInput } from '../../models/clinic-user.model';
import { SettingsNav } from '../../components/settings-nav/settings-nav';
import { UserTable } from '../../components/user-table/user-table';
import { UserForm, UserFormDialogData } from '../../components/user-form/user-form';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-user-management',
  imports: [MatButtonModule, MatIconModule, SettingsNav, UserTable],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagement {
  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly users = this.userService.users;

  addUser(): void {
    this.openForm(null);
  }

  editUser(user: ClinicUser): void {
    this.openForm(user);
  }

  deleteUser(user: ClinicUser): void {
    const dialogRef = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Delete User',
        message: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
        confirmLabel: 'Delete',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.userService.deleteUser(user.id).subscribe(() => {
        this.snackBar.open(`${user.name} deleted.`, 'Dismiss', { duration: 3000 });
      });
    });
  }

  private openForm(user: ClinicUser | null): void {
    const dialogRef = this.dialog.open<UserForm, UserFormDialogData, ClinicUserInput>(UserForm, {
      data: { user },
    });

    dialogRef.afterClosed().subscribe((input) => {
      if (!input) {
        return;
      }

      const request = user
        ? this.userService.updateUser(user.id, input)
        : this.userService.createUser(input);

      request.subscribe(() => {
        this.snackBar.open(user ? 'User updated.' : 'User added.', 'Dismiss', { duration: 3000 });
      });
    });
  }
}
