import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Patient } from '../../models/patient.model';
import { calculateAge } from '../../utils/patient-age.util';

const DISPLAYED_COLUMNS = [
  'name',
  'age',
  'gender',
  'mobile',
  'bloodGroup',
  'status',
  'actions',
] as const;

/**
 * Presentational table: sorting and pagination are owned here, same split as
 * `DoctorTable` - search/status filtering stays upstream in `PatientList`.
 */
@Component({
  selector: 'app-patient-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    TitleCasePipe,
  ],
  templateUrl: './patient-table.html',
  styleUrl: './patient-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientTable implements AfterViewInit {
  readonly patients = input.required<Patient[]>();

  readonly view = output<Patient>();
  readonly edit = output<Patient>();
  readonly delete = output<Patient>();

  private readonly sort = viewChild.required(MatSort);
  private readonly paginator = viewChild.required(MatPaginator);

  readonly displayedColumns = DISPLAYED_COLUMNS;
  readonly dataSource = new MatTableDataSource<Patient>([]);
  readonly calculateAge = calculateAge;

  constructor() {
    this.dataSource.sortingDataAccessor = (patient, columnId) => {
      switch (columnId) {
        case 'name':
          return `${patient.firstName} ${patient.lastName}`.toLowerCase();
        case 'age':
          return calculateAge(patient.dateOfBirth);
        case 'mobile':
          return patient.mobileNumber;
        case 'bloodGroup':
          return patient.bloodGroup;
        default:
          return (patient as unknown as Record<string, string>)[columnId];
      }
    };

    effect(() => {
      this.dataSource.data = this.patients();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort();
    this.dataSource.paginator = this.paginator();
  }
}
