import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { DoctorService } from '../../../services/doctor.service';
import { AvailabilityService } from '../../../services/availability.service';
import { Doctor } from '../../../models/doctor.model';
import { ScheduleNav } from '../../../components/schedule-nav/schedule-nav';
import { toIsoDate } from '../../utils/schedule-date.util';
import { ROUTE_PATHS } from '../../../../../core/constants/route-paths.constant';

type StatusVariant = 'available' | 'leave' | 'off' | 'inactive';

interface ScheduleRow {
  doctorId: string;
  name: string;
  specialization: string;
  statusLabel: string;
  statusVariant: StatusVariant;
}

@Component({
  selector: 'app-schedule-list',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    ScheduleNav,
  ],
  templateUrl: './schedule-list.html',
  styleUrl: './schedule-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleList {
  private readonly doctorService = inject(DoctorService);
  private readonly availabilityService = inject(AvailabilityService);

  readonly doctorsPath = ROUTE_PATHS.DOCTORS;
  readonly displayedColumns = ['name', 'specialization', 'status', 'actions'] as const;

  readonly rows = computed<ScheduleRow[]>(() => {
    const today = toIsoDate(new Date());

    return this.doctorService.doctors().map((doctor) => ({
      doctorId: doctor.id,
      name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      specialization: doctor.specialization,
      ...this.resolveStatus(doctor, today),
    }));
  });

  private resolveStatus(
    doctor: Doctor,
    today: string,
  ): Pick<ScheduleRow, 'statusLabel' | 'statusVariant'> {
    if (doctor.status !== 'active') {
      return { statusLabel: 'Inactive', statusVariant: 'inactive' };
    }
    if (this.availabilityService.isDoctorOnLeave(doctor.id, today)) {
      return { statusLabel: 'On Leave', statusVariant: 'leave' };
    }
    if (this.availabilityService.isDoctorAvailableOn(doctor.id, today)) {
      return { statusLabel: 'Available Today', statusVariant: 'available' };
    }
    return { statusLabel: 'Off Today', statusVariant: 'off' };
  }
}
