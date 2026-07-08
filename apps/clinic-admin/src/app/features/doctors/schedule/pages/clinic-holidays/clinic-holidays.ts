import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ScheduleService } from '../../../services/schedule.service';
import { ClinicHoliday, ClinicHolidayInput } from '../../../models/clinic-holiday.model';
import { ScheduleNav } from '../../../components/schedule-nav/schedule-nav';
import { HolidayForm, HolidayFormDialogData } from '../../../components/holiday-form/holiday-form';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-clinic-holidays',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    ScheduleNav,
  ],
  templateUrl: './clinic-holidays.html',
  styleUrl: './clinic-holidays.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClinicHolidays {
  private readonly scheduleService = inject(ScheduleService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly displayedColumns = ['name', 'date', 'recurring', 'actions'] as const;
  readonly holidays = this.scheduleService.holidays;

  addHoliday(): void {
    this.openForm(null);
  }

  editHoliday(holiday: ClinicHoliday): void {
    this.openForm(holiday);
  }

  deleteHoliday(holiday: ClinicHoliday): void {
    const dialogRef = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Delete Holiday',
        message: `Delete "${holiday.name}"?`,
        confirmLabel: 'Delete',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.scheduleService.deleteHoliday(holiday.id).subscribe(() => {
        this.snackBar.open('Holiday deleted.', 'Dismiss', { duration: 3000 });
      });
    });
  }

  private openForm(holiday: ClinicHoliday | null): void {
    const dialogRef = this.dialog.open<HolidayForm, HolidayFormDialogData, ClinicHolidayInput>(
      HolidayForm,
      { data: { holiday } },
    );

    dialogRef.afterClosed().subscribe((input) => {
      if (!input) {
        return;
      }

      const request = holiday
        ? this.scheduleService.updateHoliday(holiday.id, input)
        : this.scheduleService.createHoliday(input);

      request.subscribe(() => {
        this.snackBar.open(holiday ? 'Holiday updated.' : 'Holiday added.', 'Dismiss', {
          duration: 3000,
        });
      });
    });
  }
}
