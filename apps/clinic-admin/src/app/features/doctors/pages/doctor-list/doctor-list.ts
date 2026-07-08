import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DoctorService } from '../../services/doctor.service';
import { Doctor, DoctorStatus } from '../../models/doctor.model';
import { DoctorTable } from '../../components/doctor-table/doctor-table';
import {
  DoctorDeleteDialog,
  DoctorDeleteDialogData,
} from '../../components/doctor-delete-dialog/doctor-delete-dialog';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

type StatusFilter = DoctorStatus | 'all';

@Component({
  selector: 'app-doctor-list',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    DoctorTable,
  ],
  templateUrl: './doctor-list.html',
  styleUrl: './doctor-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorList {
  private readonly doctorService = inject(DoctorService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly doctorsPath = ROUTE_PATHS.DOCTORS;

  readonly searchTerm = signal('');
  readonly statusFilter = signal<StatusFilter>('all');

  private readonly doctors = this.doctorService.doctors;
  readonly hasDoctors = computed(() => this.doctors().length > 0);

  readonly filteredDoctors = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();

    return this.doctors().filter((doctor) => {
      const matchesStatus = status === 'all' || doctor.status === status;
      const matchesTerm =
        !term ||
        `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(term) ||
        doctor.specialization.toLowerCase().includes(term);

      return matchesStatus && matchesTerm;
    });
  });

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onStatusFilterChange(event: MatSelectChange): void {
    this.statusFilter.set(event.value as StatusFilter);
  }

  viewDoctor(doctor: Doctor): void {
    this.router.navigate([this.doctorsPath, doctor.id]);
  }

  editDoctor(doctor: Doctor): void {
    this.router.navigate([this.doctorsPath, doctor.id, 'edit']);
  }

  deleteDoctor(doctor: Doctor): void {
    const dialogRef = this.dialog.open<DoctorDeleteDialog, DoctorDeleteDialogData, boolean>(
      DoctorDeleteDialog,
      { data: { doctor } },
    );

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.doctorService.deleteDoctor(doctor.id).subscribe(() => {
        this.snackBar.open(`Dr. ${doctor.firstName} ${doctor.lastName} deleted.`, 'Dismiss', {
          duration: 3000,
        });
      });
    });
  }
}
