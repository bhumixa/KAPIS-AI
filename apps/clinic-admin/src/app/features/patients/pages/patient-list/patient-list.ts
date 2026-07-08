import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PatientService } from '../../services/patient.service';
import { Patient, PatientStatus } from '../../models/patient.model';
import { PatientTable } from '../../components/patient-table/patient-table';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

type StatusFilter = PatientStatus | 'all';

@Component({
  selector: 'app-patient-list',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PatientTable,
  ],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientList {
  private readonly patientService = inject(PatientService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly patientsPath = ROUTE_PATHS.PATIENTS;

  readonly searchTerm = signal('');
  readonly statusFilter = signal<StatusFilter>('all');

  private readonly patients = this.patientService.patients;
  readonly hasPatients = computed(() => this.patients().length > 0);

  readonly filteredPatients = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();

    return this.patients().filter((patient) => {
      const matchesStatus = status === 'all' || patient.status === status;
      const matchesTerm =
        !term ||
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(term) ||
        patient.mobileNumber.toLowerCase().includes(term) ||
        patient.email.toLowerCase().includes(term);

      return matchesStatus && matchesTerm;
    });
  });

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onStatusFilterChange(event: MatSelectChange): void {
    this.statusFilter.set(event.value as StatusFilter);
  }

  viewPatient(patient: Patient): void {
    this.router.navigate([this.patientsPath, patient.id]);
  }

  editPatient(patient: Patient): void {
    this.router.navigate([this.patientsPath, patient.id, 'edit']);
  }

  deletePatient(patient: Patient): void {
    const dialogRef = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Delete Patient',
        message: `Are you sure you want to delete ${patient.firstName} ${patient.lastName}? This action cannot be undone.`,
        confirmLabel: 'Delete',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.patientService.deletePatient(patient.id).subscribe(() => {
        this.snackBar.open(`${patient.firstName} ${patient.lastName} deleted.`, 'Dismiss', {
          duration: 3000,
        });
      });
    });
  }
}
