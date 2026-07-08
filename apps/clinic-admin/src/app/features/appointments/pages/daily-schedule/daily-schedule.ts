import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { AvailabilityService } from '../../../doctors/services/availability.service';
import { AppointmentService } from '../../services/appointment.service';
import { Appointment } from '../../models/appointment.model';
import { toIsoDate } from '../../../doctors/schedule/utils/schedule-date.util';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

interface ScheduleRow {
  start: string;
  end: string;
  appointment: Appointment | null;
}

/**
 * Front-desk day-sheet for one doctor: every possible slot for the day
 * (from `AvailabilityService`, ignoring bookings) cross-referenced against
 * that doctor's actual appointments, so free and booked slots render
 * side by side - distinct from Calendar View's Day tab, which lists every
 * doctor's appointments for a day rather than one doctor's full slot grid.
 */
@Component({
  selector: 'app-daily-schedule',
  imports: [MatFormFieldModule, MatSelectModule, MatInputModule, MatIconModule, MatChipsModule],
  templateUrl: './daily-schedule.html',
  styleUrl: './daily-schedule.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailySchedule {
  private readonly doctorService = inject(DoctorService);
  private readonly availabilityService = inject(AvailabilityService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly router = inject(Router);

  readonly today = toIsoDate(new Date());
  readonly activeDoctors = computed(() =>
    this.doctorService.doctors().filter((doctor) => doctor.status === 'active'),
  );

  readonly selectedDoctorId = signal<string | null>(null);
  readonly selectedDate = signal<string>(this.today);

  constructor() {
    const firstDoctor = this.activeDoctors()[0];
    if (firstDoctor) {
      this.selectedDoctorId.set(firstDoctor.id);
    }
  }

  private readonly appointmentsForDoctorDate = computed(() => {
    const doctorId = this.selectedDoctorId();
    const date = this.selectedDate();
    if (!doctorId) {
      return [];
    }
    return this.appointmentService
      .appointments()
      .filter((a) => a.doctorId === doctorId && a.date === date && a.status !== 'cancelled');
  });

  readonly scheduleRows = computed<ScheduleRow[]>(() => {
    const doctorId = this.selectedDoctorId();
    const date = this.selectedDate();
    if (!doctorId || !date) {
      return [];
    }

    const allSlots = this.availabilityService.getAvailableSlots(doctorId, date, []);
    const booked = this.appointmentsForDoctorDate();

    return allSlots.map((slot) => ({
      start: slot.start,
      end: slot.end,
      appointment: booked.find((a) => a.startTime === slot.start) ?? null,
    }));
  });

  patientName(patientId: string): string {
    return this.appointmentService.getPatientName(patientId);
  }

  onDoctorChange(event: MatSelectChange): void {
    this.selectedDoctorId.set(event.value as string);
  }

  onDateChange(event: Event): void {
    this.selectedDate.set((event.target as HTMLInputElement).value);
  }

  viewAppointment(appointment: Appointment): void {
    this.router.navigate([ROUTE_PATHS.APPOINTMENTS, appointment.id]);
  }
}
