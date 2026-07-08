import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PatientService } from '../../../patients/services/patient.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { AppointmentService } from '../../services/appointment.service';
import {
  AppointmentInput,
  APPOINTMENT_TYPES,
  APPOINTMENT_TYPE_LABELS,
  AppointmentType,
} from '../../models/appointment.model';
import { TimeSlot } from '../../../doctors/models/time-slot.model';
import { toIsoDate } from '../../../doctors/schedule/utils/schedule-date.util';
import { SlotPicker } from '../../components/slot-picker/slot-picker';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

/**
 * Booking wizard: Select Patient -> Select Doctor -> Select Date & Slot ->
 * Confirm. Driven by plain signals (not a `FormGroup` per step) since each
 * step is a single selection, not a set of validated fields - only the final
 * confirm step has free-text input (notes). `availableSlots` is a `computed`
 * that reads `AppointmentService.getAvailableSlots()`, which itself reads the
 * live appointments signal, so slots update immediately after a booking
 * elsewhere without any manual refresh.
 */
@Component({
  selector: 'app-appointment-book',
  imports: [
    MatStepperModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    SlotPicker,
  ],
  templateUrl: './appointment-book.html',
  styleUrl: './appointment-book.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentBook {
  private readonly patientService = inject(PatientService);
  private readonly doctorService = inject(DoctorService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly appointmentTypes = APPOINTMENT_TYPES;
  readonly appointmentTypeLabels = APPOINTMENT_TYPE_LABELS;
  readonly today = toIsoDate(new Date());

  readonly activePatients = computed(() =>
    this.patientService.patients().filter((patient) => patient.status === 'active'),
  );
  readonly activeDoctors = computed(() =>
    this.doctorService.doctors().filter((doctor) => doctor.status === 'active'),
  );

  readonly selectedPatientId = signal<string | null>(null);
  readonly selectedDoctorId = signal<string | null>(null);
  readonly selectedDate = signal<string>(this.today);
  readonly selectedSlot = signal<TimeSlot | null>(null);
  readonly appointmentType = signal<AppointmentType>('consultation');
  readonly notes = signal('');
  readonly isSaving = signal(false);

  readonly selectedPatient = computed(
    () => this.activePatients().find((patient) => patient.id === this.selectedPatientId()) ?? null,
  );
  readonly selectedDoctor = computed(
    () => this.activeDoctors().find((doctor) => doctor.id === this.selectedDoctorId()) ?? null,
  );

  readonly availableSlots = computed(() => {
    const doctorId = this.selectedDoctorId();
    const date = this.selectedDate();
    if (!doctorId || !date) {
      return [];
    }
    return this.appointmentService.getAvailableSlots(doctorId, date);
  });

  readonly patientStepComplete = computed(() => !!this.selectedPatientId());
  readonly doctorStepComplete = computed(() => !!this.selectedDoctorId());
  readonly slotStepComplete = computed(() => !!this.selectedSlot());

  selectPatient(patientId: string): void {
    this.selectedPatientId.set(patientId);
  }

  selectDoctor(doctorId: string): void {
    this.selectedDoctorId.set(doctorId);
    this.selectedSlot.set(null);
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

  onNotesChange(event: Event): void {
    this.notes.set((event.target as HTMLTextAreaElement).value);
  }

  book(): void {
    const patientId = this.selectedPatientId();
    const doctorId = this.selectedDoctorId();
    const doctor = this.selectedDoctor();
    const slot = this.selectedSlot();

    if (!patientId || !doctorId || !doctor || !slot || this.isSaving()) {
      return;
    }

    const input: AppointmentInput = {
      patientId,
      doctorId,
      date: this.selectedDate(),
      startTime: slot.start,
      endTime: slot.end,
      durationMinutes: doctor.consultationDuration,
      type: this.appointmentType(),
      status: 'scheduled',
      notes: this.notes(),
    };

    this.isSaving.set(true);

    this.appointmentService.createAppointment(input).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.snackBar.open('Appointment booked.', 'Dismiss', { duration: 3000 });
        this.router.navigate([ROUTE_PATHS.APPOINTMENTS]);
      },
      error: (error: Error) => {
        this.isSaving.set(false);
        this.snackBar.open(error.message || 'Could not book appointment.', 'Dismiss', {
          duration: 4000,
        });
      },
    });
  }

  cancel(): void {
    this.router.navigate([ROUTE_PATHS.APPOINTMENTS]);
  }
}
