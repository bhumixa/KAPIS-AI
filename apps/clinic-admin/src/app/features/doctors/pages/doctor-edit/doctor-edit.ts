import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DoctorService } from '../../services/doctor.service';
import { DoctorInput } from '../../models/doctor.model';
import { DoctorForm } from '../../components/doctor-form/doctor-form';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

@Component({
  selector: 'app-doctor-edit',
  imports: [MatCardModule, MatProgressSpinnerModule, DoctorForm],
  templateUrl: './doctor-edit.html',
  styleUrl: './doctor-edit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorEdit {
  private readonly doctorService = inject(DoctorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  private readonly doctorId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly doctor = toSignal(this.doctorService.getDoctor(this.doctorId), {
    initialValue: undefined,
  });
  readonly isSaving = signal(false);

  update(input: DoctorInput): void {
    this.isSaving.set(true);

    this.doctorService.updateDoctor(this.doctorId, input).subscribe((doctor) => {
      this.isSaving.set(false);
      this.snackBar.open(`Dr. ${doctor.firstName} ${doctor.lastName} updated.`, 'Dismiss', {
        duration: 3000,
      });
      this.router.navigate([ROUTE_PATHS.DOCTORS]);
    });
  }

  cancel(): void {
    this.router.navigate([ROUTE_PATHS.DOCTORS]);
  }
}
