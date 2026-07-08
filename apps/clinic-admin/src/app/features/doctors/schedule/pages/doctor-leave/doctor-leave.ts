import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DoctorService } from '../../../services/doctor.service';
import { ScheduleService } from '../../../services/schedule.service';
import {
  DoctorLeave,
  DoctorLeaveInput,
  LEAVE_TYPE_LABELS,
} from '../../../models/doctor-leave.model';
import { ScheduleNav } from '../../../components/schedule-nav/schedule-nav';
import { LeaveForm, LeaveFormDialogData } from '../../../components/leave-form/leave-form';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../../shared/components/confirm-dialog/confirm-dialog';

interface LeaveRow extends DoctorLeave {
  doctorName: string;
  typeLabel: string;
}

@Component({
  selector: 'app-doctor-leave',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    ScheduleNav,
  ],
  templateUrl: './doctor-leave.html',
  styleUrl: './doctor-leave.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorLeavePage {
  private readonly doctorService = inject(DoctorService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly displayedColumns = [
    'doctor',
    'type',
    'startDate',
    'endDate',
    'reason',
    'actions',
  ] as const;

  readonly rows = computed<LeaveRow[]>(() => {
    const doctors = this.doctorService.doctors();

    return this.scheduleService.leaves().map((leave) => {
      const doctor = doctors.find((d) => d.id === leave.doctorId);
      return {
        ...leave,
        doctorName: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Unknown Doctor',
        typeLabel: LEAVE_TYPE_LABELS[leave.type],
      };
    });
  });

  addLeave(): void {
    this.openForm(null);
  }

  editLeave(leave: LeaveRow): void {
    this.openForm(leave);
  }

  deleteLeave(leave: LeaveRow): void {
    const dialogRef = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Delete Leave',
        message: `Delete this leave record for ${leave.doctorName}?`,
        confirmLabel: 'Delete',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.scheduleService.deleteLeave(leave.id).subscribe(() => {
        this.snackBar.open('Leave deleted.', 'Dismiss', { duration: 3000 });
      });
    });
  }

  private openForm(leave: DoctorLeave | null): void {
    const dialogRef = this.dialog.open<LeaveForm, LeaveFormDialogData, DoctorLeaveInput>(
      LeaveForm,
      { data: { leave } },
    );

    dialogRef.afterClosed().subscribe((input) => {
      if (!input) {
        return;
      }

      const request = leave
        ? this.scheduleService.updateLeave(leave.id, input)
        : this.scheduleService.createLeave(input);

      request.subscribe(() => {
        this.snackBar.open(leave ? 'Leave updated.' : 'Leave added.', 'Dismiss', {
          duration: 3000,
        });
      });
    });
  }
}
