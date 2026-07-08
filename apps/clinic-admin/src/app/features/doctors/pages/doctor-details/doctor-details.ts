import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { DoctorService } from '../../services/doctor.service';
import { ScheduleService } from '../../services/schedule.service';
import { DoctorCard } from '../../components/doctor-card/doctor-card';
import { WeeklyScheduleEditor } from '../../components/weekly-schedule-editor/weekly-schedule-editor';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

@Component({
  selector: 'app-doctor-details',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTabsModule,
    DoctorCard,
    WeeklyScheduleEditor,
  ],
  templateUrl: './doctor-details.html',
  styleUrl: './doctor-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorDetails {
  private readonly doctorService = inject(DoctorService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly doctorId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly doctor = toSignal(this.doctorService.getDoctor(this.doctorId), {
    initialValue: undefined,
  });
  readonly schedule = toSignal(this.scheduleService.getSchedule(this.doctorId), {
    initialValue: null,
  });
  readonly doctorsPath = ROUTE_PATHS.DOCTORS;

  editDoctor(): void {
    this.router.navigate([this.doctorsPath, this.doctorId, 'edit']);
  }
}
