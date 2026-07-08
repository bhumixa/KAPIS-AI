import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Doctor } from '../../models/doctor.model';

const DISPLAYED_COLUMNS = [
  'name',
  'specialization',
  'experience',
  'fee',
  'duration',
  'status',
  'actions',
] as const;

/**
 * Presentational table: sorting and pagination are owned here so every
 * feature that lists doctors gets the same behavior for free. Search/status
 * filtering happens upstream (in `DoctorList`) since that's page-level state,
 * not something this reusable table should know about.
 */
@Component({
  selector: 'app-doctor-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    CurrencyPipe,
    TitleCasePipe,
  ],
  templateUrl: './doctor-table.html',
  styleUrl: './doctor-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorTable implements AfterViewInit {
  readonly doctors = input.required<Doctor[]>();

  readonly view = output<Doctor>();
  readonly edit = output<Doctor>();
  readonly delete = output<Doctor>();

  private readonly sort = viewChild.required(MatSort);
  private readonly paginator = viewChild.required(MatPaginator);

  readonly displayedColumns = DISPLAYED_COLUMNS;
  readonly dataSource = new MatTableDataSource<Doctor>([]);

  constructor() {
    effect(() => {
      this.dataSource.data = this.doctors();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort();
    this.dataSource.paginator = this.paginator();
  }
}
