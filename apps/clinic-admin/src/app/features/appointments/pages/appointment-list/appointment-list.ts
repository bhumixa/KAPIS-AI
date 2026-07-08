import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppointmentService } from '../../services/appointment.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { Appointment, AppointmentStatus } from '../../models/appointment.model';
import { AppointmentTable } from '../../components/appointment-table/appointment-table';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

type StatusFilter = AppointmentStatus | 'all';

@Component({
  selector: 'app-appointment-list',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    AppointmentTable,
  ],
  templateUrl: './appointment-list.html',
  styleUrl: './appointment-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentList {
  private readonly appointmentService = inject(AppointmentService);
  private readonly doctorService = inject(DoctorService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly appointmentsPath = ROUTE_PATHS.APPOINTMENTS;
  readonly doctors = this.doctorService.doctors;

  readonly searchTerm = signal('');
  readonly dateFilter = signal('');
  readonly doctorFilter = signal<string>('all');
  readonly statusFilter = signal<StatusFilter>('all');

  private readonly appointments = this.appointmentService.appointments;
  readonly hasAppointments = computed(() => this.appointments().length > 0);

  readonly filteredAppointments = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const date = this.dateFilter();
    const doctorId = this.doctorFilter();
    const status = this.statusFilter();

    return this.appointments().filter((appointment) => {
      const matchesStatus = status === 'all' || appointment.status === status;
      const matchesDate = !date || appointment.date === date;
      const matchesDoctor = doctorId === 'all' || appointment.doctorId === doctorId;
      const matchesTerm =
        !term ||
        this.appointmentService
          .getPatientName(appointment.patientId)
          .toLowerCase()
          .includes(term) ||
        this.appointmentService.getDoctorName(appointment.doctorId).toLowerCase().includes(term);

      return matchesStatus && matchesDate && matchesDoctor && matchesTerm;
    });
  });

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onDateFilterChange(event: Event): void {
    this.dateFilter.set((event.target as HTMLInputElement).value);
  }

  onDoctorFilterChange(event: MatSelectChange): void {
    this.doctorFilter.set(event.value as string);
  }

  onStatusFilterChange(event: MatSelectChange): void {
    this.statusFilter.set(event.value as StatusFilter);
  }

  viewAppointment(appointment: Appointment): void {
    this.router.navigate([this.appointmentsPath, appointment.id]);
  }

  editAppointment(appointment: Appointment): void {
    this.router.navigate([this.appointmentsPath, appointment.id, 'edit']);
  }

  completeAppointment(appointment: Appointment): void {
    this.appointmentService.completeAppointment(appointment.id).subscribe(() => {
      this.snackBar.open('Appointment marked as completed.', 'Dismiss', { duration: 3000 });
    });
  }

  cancelAppointment(appointment: Appointment): void {
    const dialogRef = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Cancel Appointment',
        message: `Are you sure you want to cancel ${this.appointmentService.getPatientName(appointment.patientId)}'s appointment on ${appointment.date} at ${appointment.startTime}?`,
        confirmLabel: 'Cancel Appointment',
        cancelLabel: 'Keep Appointment',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.appointmentService.cancelAppointment(appointment.id).subscribe(() => {
        this.snackBar.open('Appointment cancelled.', 'Dismiss', { duration: 3000 });
      });
    });
  }
}
