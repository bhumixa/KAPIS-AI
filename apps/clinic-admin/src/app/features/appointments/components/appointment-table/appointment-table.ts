import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Appointment } from '../../models/appointment.model';
import { AppointmentService } from '../../services/appointment.service';

const DISPLAYED_COLUMNS = [
  'patient',
  'doctor',
  'date',
  'time',
  'type',
  'status',
  'actions',
] as const;

/**
 * Presentational table: sorting and pagination are owned here, same split as
 * `DoctorTable`/`PatientTable` - search/date/doctor/status filtering stays
 * upstream in `AppointmentList`. Patient/doctor names are resolved via
 * `AppointmentService` (which already reuses `PatientService`/`DoctorService`)
 * instead of duplicating the id-to-name lookup here.
 */
@Component({
  selector: 'app-appointment-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    DatePipe,
    TitleCasePipe,
  ],
  templateUrl: './appointment-table.html',
  styleUrl: './appointment-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentTable implements AfterViewInit {
  private readonly appointmentService = inject(AppointmentService);

  readonly appointments = input.required<Appointment[]>();

  readonly view = output<Appointment>();
  readonly edit = output<Appointment>();
  readonly cancelAppointment = output<Appointment>();
  readonly complete = output<Appointment>();

  private readonly sort = viewChild.required(MatSort);
  private readonly paginator = viewChild.required(MatPaginator);

  readonly displayedColumns = DISPLAYED_COLUMNS;
  readonly dataSource = new MatTableDataSource<Appointment>([]);
  readonly patientName = (id: string) => this.appointmentService.getPatientName(id);
  readonly doctorName = (id: string) => this.appointmentService.getDoctorName(id);

  constructor() {
    this.dataSource.sortingDataAccessor = (appointment, columnId) => {
      switch (columnId) {
        case 'patient':
          return this.patientName(appointment.patientId).toLowerCase();
        case 'doctor':
          return this.doctorName(appointment.doctorId).toLowerCase();
        case 'time':
          return appointment.startTime;
        default:
          return (appointment as unknown as Record<string, string>)[columnId];
      }
    };

    effect(() => {
      this.dataSource.data = this.appointments();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort();
    this.dataSource.paginator = this.paginator();
  }
}
