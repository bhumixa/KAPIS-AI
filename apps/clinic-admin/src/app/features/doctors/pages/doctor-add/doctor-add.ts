import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DoctorService } from '../../services/doctor.service';
import { DoctorInput } from '../../models/doctor.model';
import { DoctorForm } from '../../components/doctor-form/doctor-form';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

@Component({
  selector: 'app-doctor-add',
  imports: [MatCardModule, DoctorForm],
  templateUrl: './doctor-add.html',
  styleUrl: './doctor-add.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorAdd {
  private readonly doctorService = inject(DoctorService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly isSaving = signal(false);

  create(input: DoctorInput): void {
    this.isSaving.set(true);

    this.doctorService.createDoctor(input).subscribe((doctor) => {
      this.isSaving.set(false);
      this.snackBar.open(`Dr. ${doctor.firstName} ${doctor.lastName} added.`, 'Dismiss', {
        duration: 3000,
      });
      this.router.navigate([ROUTE_PATHS.DOCTORS]);
    });
  }

  cancel(): void {
    this.router.navigate([ROUTE_PATHS.DOCTORS]);
  }
}
