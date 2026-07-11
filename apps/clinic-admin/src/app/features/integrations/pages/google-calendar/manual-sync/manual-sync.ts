import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GoogleCalendarService } from '../../../services/google-calendar.service';
import { GoogleCalendarNav } from '../../../components/google-calendar-nav/google-calendar-nav';
import { AppointmentService } from '../../../../appointments/services/appointment.service';
import { CalendarEvent } from '../../../models/calendar-event.model';

/**
 * Sprint 22 - on-demand equivalent of the automatic
 * appointment.created/updated/cancelled sync (GoogleCalendarSyncService):
 * picks an appointment (AppointmentService, already loaded app-wide - "Reuse
 * AppointmentService" on the frontend too, no separate appointment fetch)
 * and calls POST /google-calendar/sync/:appointmentId. Also exposes "Read
 * Calendar Event" so a synced event can be checked without leaving the app.
 */
@Component({
  selector: 'app-google-calendar-manual-sync',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    GoogleCalendarNav,
  ],
  templateUrl: './manual-sync.html',
  styleUrl: './manual-sync.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualSync {
  private readonly formBuilder = inject(FormBuilder);
  private readonly appointmentService = inject(AppointmentService);
  private readonly googleCalendarService = inject(GoogleCalendarService);
  private readonly snackBar = inject(MatSnackBar);

  readonly appointments = this.appointmentService.appointments;
  readonly isSyncing = signal(false);
  readonly isLoadingEvent = signal(false);
  readonly event = signal<CalendarEvent | null>(null);

  readonly form = this.formBuilder.nonNullable.group({ appointmentId: [''] });

  getPatientName(patientId: string): string {
    return this.appointmentService.getPatientName(patientId);
  }

  getDoctorName(doctorId: string): string {
    return this.appointmentService.getDoctorName(doctorId);
  }

  syncNow(): void {
    const appointmentId = this.form.getRawValue().appointmentId;
    if (!appointmentId || this.isSyncing()) {
      return;
    }

    this.isSyncing.set(true);
    this.googleCalendarService.syncNow(appointmentId).subscribe({
      next: () => {
        this.isSyncing.set(false);
        this.snackBar.open('Appointment synced to Google Calendar.', 'Dismiss', { duration: 3000 });
        this.readEvent();
      },
      error: (error: HttpErrorResponse) => {
        this.isSyncing.set(false);
        const message = (error.error as { message?: string } | null)?.message;
        this.snackBar.open(message ?? 'Could not sync this appointment.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  readEvent(): void {
    const appointmentId = this.form.getRawValue().appointmentId;
    if (!appointmentId || this.isLoadingEvent()) {
      return;
    }

    this.isLoadingEvent.set(true);
    this.googleCalendarService.getEventForAppointment(appointmentId).subscribe({
      next: (event) => {
        this.isLoadingEvent.set(false);
        this.event.set(event);
        if (!event) {
          this.snackBar.open('This appointment has not been synced yet.', 'Dismiss', { duration: 3000 });
        }
      },
      error: () => {
        this.isLoadingEvent.set(false);
        this.event.set(null);
      },
    });
  }
}
