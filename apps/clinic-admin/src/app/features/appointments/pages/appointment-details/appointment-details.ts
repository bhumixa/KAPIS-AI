import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppointmentService } from '../../services/appointment.service';
import { PatientService } from '../../../patients/services/patient.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { APPOINTMENT_TYPE_LABELS } from '../../models/appointment.model';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

@Component({
  selector: 'app-appointment-details',
  imports: [
    RouterLink,
    DatePipe,
    TitleCasePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './appointment-details.html',
  styleUrl: './appointment-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentDetails {
  private readonly appointmentService = inject(AppointmentService);
  private readonly patientService = inject(PatientService);
  private readonly doctorService = inject(DoctorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private readonly appointmentId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly appointment = toSignal(this.appointmentService.getAppointment(this.appointmentId), {
    initialValue: undefined,
  });

  readonly appointmentTypeLabels = APPOINTMENT_TYPE_LABELS;
  readonly appointmentsPath = ROUTE_PATHS.APPOINTMENTS;

  readonly patient = computed(() => {
    const appointment = this.appointment();
    return appointment
      ? this.patientService.patients().find((p) => p.id === appointment.patientId)
      : undefined;
  });

  readonly doctor = computed(() => {
    const appointment = this.appointment();
    return appointment
      ? this.doctorService.doctors().find((d) => d.id === appointment.doctorId)
      : undefined;
  });

  editAppointment(): void {
    this.router.navigate([this.appointmentsPath, this.appointmentId, 'edit']);
  }

  completeAppointment(): void {
    this.appointmentService.completeAppointment(this.appointmentId).subscribe(() => {
      this.snackBar.open('Appointment marked as completed.', 'Dismiss', { duration: 3000 });
    });
  }

  cancelAppointment(): void {
    const dialogRef = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Cancel Appointment',
        message: 'Are you sure you want to cancel this appointment?',
        confirmLabel: 'Cancel Appointment',
        cancelLabel: 'Keep Appointment',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.appointmentService.cancelAppointment(this.appointmentId).subscribe(() => {
        this.snackBar.open('Appointment cancelled.', 'Dismiss', { duration: 3000 });
      });
    });
  }
}
