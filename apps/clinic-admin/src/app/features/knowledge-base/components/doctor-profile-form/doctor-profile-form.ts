import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Doctor } from '../../../doctors/models/doctor.model';
import {
  DoctorProfileExtension,
  DoctorProfileExtensionInput,
} from '../../models/doctor-profile-extension.model';

export interface DoctorProfileFormDialogData {
  doctor: Doctor;
  extension: DoctorProfileExtension | undefined;
}

function toListText(values: string[] | undefined): string {
  return (values ?? []).join(', ');
}

function fromListText(text: string): string[] {
  return text
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

/**
 * Self-contained dialog for the AI/patient-facing content that extends a
 * doctor's record. The doctor identity fields shown here (name,
 * specialization) are read-only, sourced directly from the `Doctor` passed
 * in - this form only ever writes `DoctorProfileExtension` fields, never
 * touches `DoctorService`.
 */
@Component({
  selector: 'app-doctor-profile-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './doctor-profile-form.html',
  styleUrl: './doctor-profile-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorProfileForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<DoctorProfileForm, DoctorProfileExtensionInput>);
  readonly data = inject<DoctorProfileFormDialogData>(MAT_DIALOG_DATA);

  readonly form = this.formBuilder.nonNullable.group({
    biography: [this.data.extension?.biography ?? ''],
    languagesText: [toListText(this.data.extension?.languages)],
    awardsText: [toListText(this.data.extension?.awards)],
    certificationsText: [toListText(this.data.extension?.certifications)],
    publicationsText: [toListText(this.data.extension?.publications)],
    interestsText: [toListText(this.data.extension?.interests)],
    videoUrl: [this.data.extension?.videoUrl ?? ''],
    displayPriority: [this.data.extension?.displayPriority ?? 0, Validators.min(0)],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const input: DoctorProfileExtensionInput = {
      doctorId: this.data.doctor.id,
      biography: value.biography,
      languages: fromListText(value.languagesText),
      awards: fromListText(value.awardsText),
      certifications: fromListText(value.certificationsText),
      publications: fromListText(value.publicationsText),
      interests: fromListText(value.interestsText),
      videoUrl: value.videoUrl,
      displayPriority: value.displayPriority,
    };

    this.dialogRef.close(input);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
