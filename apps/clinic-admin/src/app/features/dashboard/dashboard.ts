import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DoctorService } from '../doctors/services/doctor.service';
import { AvailabilityService } from '../doctors/services/availability.service';
import { PatientService } from '../patients/services/patient.service';
import { AppointmentService } from '../appointments/services/appointment.service';
import { ROUTE_PATHS } from '../../core/constants/route-paths.constant';
import { QuickAction, SummaryCard } from './dashboard-summary.model';

/**
 * Sprint 1 had no backend, so every number here was a hardcoded placeholder.
 * Doctors, Doctors Available Today, Doctors On Leave (Sprint 2/3), Patients
 * (Sprint 4), and now Today's/Upcoming/Cancelled/Completed Appointments
 * (Sprint 5) are live off their respective services; only Messages stays
 * hardcoded until that service exists.
 */
@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly snackBar = inject(MatSnackBar);
  private readonly doctorService = inject(DoctorService);
  private readonly availabilityService = inject(AvailabilityService);
  private readonly patientService = inject(PatientService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly router = inject(Router);

  readonly summaryCards = computed<SummaryCard[]>(() => [
    {
      label: "Today's Appointments",
      value: this.appointmentService.todaysAppointmentCount(),
      icon: 'event',
      accentVar: '--mat-sys-primary',
    },
    {
      label: 'Doctors',
      value: this.doctorService.doctorCount(),
      icon: 'medical_services',
      accentVar: '--mat-sys-tertiary',
    },
    {
      label: 'Patients',
      value: this.patientService.patientCount(),
      icon: 'groups',
      accentVar: '--kapis-color-success',
    },
    { label: 'Messages', value: 34, icon: 'chat', accentVar: '--kapis-color-warning' },
    {
      label: 'Doctors Available Today',
      value: this.availabilityService.doctorsAvailableToday(),
      icon: 'event_available',
      accentVar: '--kapis-color-success',
    },
    {
      label: 'Doctors On Leave',
      value: this.availabilityService.doctorsOnLeaveToday(),
      icon: 'event_busy',
      accentVar: '--kapis-color-warning',
    },
    {
      label: 'Upcoming Appointments',
      value: this.appointmentService.upcomingAppointmentCount(),
      icon: 'upcoming',
      accentVar: '--mat-sys-primary',
    },
    {
      label: 'Cancelled Today',
      value: this.appointmentService.cancelledTodayCount(),
      icon: 'event_busy',
      accentVar: '--kapis-color-warning',
    },
    {
      label: 'Completed Today',
      value: this.appointmentService.completedTodayCount(),
      icon: 'task_alt',
      accentVar: '--kapis-color-success',
    },
  ]);

  readonly quickActions: QuickAction[] = [
    { label: 'New Appointment', icon: 'add_circle' },
    { label: 'Add Patient', icon: 'person_add' },
    { label: 'Add Doctor', icon: 'medical_information' },
    { label: 'Send Message', icon: 'send' },
  ];

  onQuickAction(action: QuickAction): void {
    if (action.label === 'Add Doctor') {
      this.router.navigate([ROUTE_PATHS.DOCTORS, 'add']);
      return;
    }

    if (action.label === 'Add Patient') {
      this.router.navigate([ROUTE_PATHS.PATIENTS, 'add']);
      return;
    }

    if (action.label === 'New Appointment') {
      this.router.navigate([ROUTE_PATHS.APPOINTMENTS, 'book']);
      return;
    }

    this.snackBar.open(`${action.label} is coming soon.`, 'Dismiss', { duration: 3000 });
  }
}
