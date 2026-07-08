import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Doctor } from '../../models/doctor.model';

export interface DoctorDeleteDialogData {
  doctor: Doctor;
}

@Component({
  selector: 'app-doctor-delete-dialog',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './doctor-delete-dialog.html',
  styleUrl: './doctor-delete-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorDeleteDialog {
  private readonly dialogRef = inject(MatDialogRef<DoctorDeleteDialog, boolean>);
  readonly data = inject<DoctorDeleteDialogData>(MAT_DIALOG_DATA);

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
