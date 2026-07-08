import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppointmentService } from '../../services/appointment.service';
import { Appointment } from '../../models/appointment.model';
import {
  MONTH_NAMES,
  addDaysToIsoDate,
  addMonths,
  getMonthGridDates,
  getWeekDates,
} from '../../utils/calendar.util';
import { toIsoDate } from '../../../doctors/schedule/utils/schedule-date.util';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

type CalendarViewMode = 'month' | 'week' | 'day';

/**
 * Mock-data-only calendar: Month/Week/Day are three renderings of the same
 * `appointmentsByDate` lookup, switched via a `mat-button-toggle-group`
 * rather than routed tabs, since none of the three needs its own URL/params.
 */
@Component({
  selector: 'app-calendar-view',
  imports: [MatButtonModule, MatButtonToggleModule, MatIconModule, MatTooltipModule],
  templateUrl: './calendar-view.html',
  styleUrl: './calendar-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarView {
  private readonly appointmentService = inject(AppointmentService);
  private readonly router = inject(Router);

  readonly today = toIsoDate(new Date());
  readonly monthNames = MONTH_NAMES;

  readonly viewMode = signal<CalendarViewMode>('month');
  readonly referenceDate = signal<string>(this.today);

  private readonly appointmentsByDate = computed(() => {
    const map = new Map<string, Appointment[]>();
    for (const appointment of this.appointmentService.appointments()) {
      const list = map.get(appointment.date) ?? [];
      list.push(appointment);
      map.set(appointment.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  });

  readonly referenceYear = computed(() => Number(this.referenceDate().slice(0, 4)));
  readonly referenceMonth = computed(() => Number(this.referenceDate().slice(5, 7)) - 1);
  readonly referenceMonthLabel = computed(
    () => `${this.monthNames[this.referenceMonth()]} ${this.referenceYear()}`,
  );

  readonly monthGridDates = computed(() =>
    getMonthGridDates(this.referenceYear(), this.referenceMonth()),
  );
  readonly weekDates = computed(() => getWeekDates(this.referenceDate()));
  readonly dayAppointments = computed(
    () => this.appointmentsByDate().get(this.referenceDate()) ?? [],
  );

  appointmentsOn(isoDate: string): Appointment[] {
    return this.appointmentsByDate().get(isoDate) ?? [];
  }

  isCurrentMonth(isoDate: string): boolean {
    return Number(isoDate.slice(5, 7)) - 1 === this.referenceMonth();
  }

  isToday(isoDate: string): boolean {
    return isoDate === this.today;
  }

  patientName(patientId: string): string {
    return this.appointmentService.getPatientName(patientId);
  }

  doctorName(doctorId: string): string {
    return this.appointmentService.getDoctorName(doctorId);
  }

  setViewMode(mode: CalendarViewMode): void {
    this.viewMode.set(mode);
  }

  goToday(): void {
    this.referenceDate.set(this.today);
  }

  goPrevious(): void {
    this.shift(-1);
  }

  goNext(): void {
    this.shift(1);
  }

  private shift(direction: 1 | -1): void {
    switch (this.viewMode()) {
      case 'month': {
        const { year, month } = addMonths(this.referenceYear(), this.referenceMonth(), direction);
        this.referenceDate.set(toIsoDate(new Date(year, month, 1)));
        return;
      }
      case 'week':
        this.referenceDate.set(addDaysToIsoDate(this.referenceDate(), direction * 7));
        return;
      case 'day':
        this.referenceDate.set(addDaysToIsoDate(this.referenceDate(), direction));
    }
  }

  openDay(isoDate: string): void {
    this.referenceDate.set(isoDate);
    this.viewMode.set('day');
  }

  viewAppointment(appointment: Appointment): void {
    this.router.navigate([ROUTE_PATHS.APPOINTMENTS, appointment.id]);
  }
}
