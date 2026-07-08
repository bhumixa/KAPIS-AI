import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DoctorService } from '../../../services/doctor.service';
import { ScheduleService } from '../../../services/schedule.service';
import { DoctorScheduleInput } from '../../../models/doctor-schedule.model';
import { WeeklyScheduleEditor } from '../../../components/weekly-schedule-editor/weekly-schedule-editor';
import { ROUTE_PATHS } from '../../../../../core/constants/route-paths.constant';

@Component({
  selector: 'app-manage-schedule',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    WeeklyScheduleEditor,
  ],
  templateUrl: './manage-schedule.html',
  styleUrl: './manage-schedule.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageSchedule {
  private readonly doctorService = inject(DoctorService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  private readonly doctorId = this.route.snapshot.paramMap.get('doctorId') ?? '';

  readonly doctorsPath = ROUTE_PATHS.DOCTORS;
  readonly doctor = toSignal(this.doctorService.getDoctor(this.doctorId), {
    initialValue: undefined,
  });
  readonly schedule = toSignal(this.scheduleService.getSchedule(this.doctorId), {
    initialValue: null,
  });
  readonly isSaving = signal(false);

  save(input: DoctorScheduleInput): void {
    this.isSaving.set(true);

    this.scheduleService.updateSchedule(this.doctorId, input).subscribe(() => {
      this.isSaving.set(false);
      this.snackBar.open('Schedule saved.', 'Dismiss', { duration: 3000 });
      this.router.navigate([this.doctorsPath, 'schedule']);
    });
  }
}
