import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PatientService } from '../../services/patient.service';
import { PatientInput } from '../../models/patient.model';
import { PatientForm } from '../../components/patient-form/patient-form';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

@Component({
  selector: 'app-patient-add',
  imports: [MatCardModule, PatientForm],
  templateUrl: './patient-add.html',
  styleUrl: './patient-add.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientAdd {
  private readonly patientService = inject(PatientService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly isSaving = signal(false);

  create(input: PatientInput): void {
    this.isSaving.set(true);

    this.patientService.createPatient(input).subscribe((patient) => {
      this.isSaving.set(false);
      this.snackBar.open(`${patient.firstName} ${patient.lastName} added.`, 'Dismiss', {
        duration: 3000,
      });
      this.router.navigate([ROUTE_PATHS.PATIENTS]);
    });
  }

  cancel(): void {
    this.router.navigate([ROUTE_PATHS.PATIENTS]);
  }
}
