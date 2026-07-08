import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PatientService } from '../../services/patient.service';
import { PatientInput } from '../../models/patient.model';
import { PatientForm } from '../../components/patient-form/patient-form';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

@Component({
  selector: 'app-patient-edit',
  imports: [MatCardModule, MatProgressSpinnerModule, PatientForm],
  templateUrl: './patient-edit.html',
  styleUrl: './patient-edit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientEdit {
  private readonly patientService = inject(PatientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  private readonly patientId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly patient = toSignal(this.patientService.getPatient(this.patientId), {
    initialValue: undefined,
  });
  readonly isSaving = signal(false);

  update(input: PatientInput): void {
    this.isSaving.set(true);

    this.patientService.updatePatient(this.patientId, input).subscribe((patient) => {
      this.isSaving.set(false);
      this.snackBar.open(`${patient.firstName} ${patient.lastName} updated.`, 'Dismiss', {
        duration: 3000,
      });
      this.router.navigate([ROUTE_PATHS.PATIENTS]);
    });
  }

  cancel(): void {
    this.router.navigate([ROUTE_PATHS.PATIENTS]);
  }
}
