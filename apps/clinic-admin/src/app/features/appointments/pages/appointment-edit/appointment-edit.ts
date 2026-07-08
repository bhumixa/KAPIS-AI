import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppointmentService } from '../../services/appointment.service';
import {
  AppointmentInput,
  AppointmentStatus,
  APPOINTMENT_TYPES,
  APPOINTMENT_TYPE_LABELS,
  AppointmentType,
} from '../../models/appointment.model';
import { TimeSlot } from '../../../doctors/models/time-slot.model';
import { toIsoDate } from '../../../doctors/schedule/utils/schedule-date.util';
import { SlotPicker } from '../../components/slot-picker/slot-picker';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

/**
 * Reschedule/edit: patient and doctor stay fixed (shown read-only) - only
 * date/slot/type/notes/status change. Re-picking a slot reuses
 * `AppointmentService.getAvailableSlots()` with this appointment excluded
 * from the overlap check, so its own current slot still shows as available.
 */
@Component({
  selector: 'app-appointment-edit',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SlotPicker,
  ],
  templateUrl: './appointment-edit.html',
  styleUrl: './appointment-edit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentEdit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  private readonly appointmentId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly appointment = toSignal(this.appointmentService.getAppointment(this.appointmentId), {
    initialValue: undefined,
  });

  readonly appointmentTypes = APPOINTMENT_TYPES;
  readonly appointmentTypeLabels = APPOINTMENT_TYPE_LABELS;
  readonly today = toIsoDate(new Date());

  readonly selectedDate = signal<string>(this.today);
  readonly selectedSlot = signal<TimeSlot | null>(null);
  readonly appointmentType = signal<AppointmentType>('consultation');
  readonly status = signal<AppointmentStatus>('scheduled');
  readonly notes = signal('');
  readonly isSaving = signal(false);
  private initialized = false;

  readonly patientName = computed(() => {
    const appointment = this.appointment();
    return appointment ? this.appointmentService.getPatientName(appointment.patientId) : '';
  });
  readonly doctorName = computed(() => {
    const appointment = this.appointment();
    return appointment ? this.appointmentService.getDoctorName(appointment.doctorId) : '';
  });

  readonly availableSlots = computed(() => {
    const appointment = this.appointment();
    const date = this.selectedDate();
    if (!appointment || !date) {
      return [];
    }
    return this.appointmentService.getAvailableSlots(
      appointment.doctorId,
      date,
      this.appointmentId,
    );
  });

  constructor() {
    effect(() => {
      const appointment = this.appointment();
      if (appointment && !this.initialized) {
        this.initialized = true;
        this.selectedDate.set(appointment.date);
        this.selectedSlot.set({ start: appointment.startTime, end: appointment.endTime });
        this.appointmentType.set(appointment.type);
        this.status.set(appointment.status);
        this.notes.set(appointment.notes);
      }
    });
  }

  onDateChange(event: Event): void {
    this.selectedDate.set((event.target as HTMLInputElement).value);
    this.selectedSlot.set(null);
  }

  selectSlot(slot: TimeSlot): void {
    this.selectedSlot.set(slot);
  }

  onTypeChange(type: AppointmentType): void {
    this.appointmentType.set(type);
  }

  onStatusChange(status: AppointmentStatus): void {
    this.status.set(status);
  }

  onNotesChange(event: Event): void {
    this.notes.set((event.target as HTMLTextAreaElement).value);
  }

  save(): void {
    const appointment = this.appointment();
    const slot = this.selectedSlot();
    if (!appointment || !slot || this.isSaving()) {
      return;
    }

    const input: AppointmentInput = {
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      date: this.selectedDate(),
      startTime: slot.start,
      endTime: slot.end,
      durationMinutes: appointment.durationMinutes,
      type: this.appointmentType(),
      status: this.status(),
      notes: this.notes(),
    };

    this.isSaving.set(true);

    this.appointmentService.updateAppointment(this.appointmentId, input).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.snackBar.open('Appointment updated.', 'Dismiss', { duration: 3000 });
        this.router.navigate([ROUTE_PATHS.APPOINTMENTS]);
      },
      error: (error: Error) => {
        this.isSaving.set(false);
        this.snackBar.open(error.message || 'Could not update appointment.', 'Dismiss', {
          duration: 4000,
        });
      },
    });
  }

  cancel(): void {
    this.router.navigate([ROUTE_PATHS.APPOINTMENTS]);
  }
}
