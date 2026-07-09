import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { KnowledgeBaseService } from '../../services/knowledge-base.service';
import { DoctorProfileExtensionInput } from '../../models/doctor-profile-extension.model';
import { KnowledgeBaseNav } from '../../components/knowledge-base-nav/knowledge-base-nav';
import {
  DoctorProfileRow,
  DoctorProfileTable,
} from '../../components/doctor-profile-table/doctor-profile-table';
import {
  DoctorProfileForm,
  DoctorProfileFormDialogData,
} from '../../components/doctor-profile-form/doctor-profile-form';

@Component({
  selector: 'app-doctor-profiles',
  imports: [KnowledgeBaseNav, DoctorProfileTable],
  templateUrl: './doctor-profiles.html',
  styleUrl: './doctor-profiles.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorProfiles {
  private readonly doctorService = inject(DoctorService);
  private readonly knowledgeBaseService = inject(KnowledgeBaseService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly rows = computed<DoctorProfileRow[]>(() => {
    const extensions = this.knowledgeBaseService.doctorProfileExtensions();

    return this.doctorService.doctors().map((doctor) => ({
      doctor,
      extension: extensions.find((extension) => extension.doctorId === doctor.id),
    }));
  });

  editProfile(row: DoctorProfileRow): void {
    const dialogRef = this.dialog.open<
      DoctorProfileForm,
      DoctorProfileFormDialogData,
      DoctorProfileExtensionInput
    >(DoctorProfileForm, { data: { doctor: row.doctor, extension: row.extension } });

    dialogRef.afterClosed().subscribe((input) => {
      if (!input) {
        return;
      }

      this.knowledgeBaseService.saveDoctorProfileExtension(input).subscribe(() => {
        this.snackBar.open('Doctor profile saved.', 'Dismiss', { duration: 3000 });
      });
    });
  }
}
