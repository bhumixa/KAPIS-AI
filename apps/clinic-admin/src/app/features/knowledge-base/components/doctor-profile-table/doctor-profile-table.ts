import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Doctor } from '../../../doctors/models/doctor.model';
import { DoctorProfileExtension } from '../../models/doctor-profile-extension.model';

export interface DoctorProfileRow {
  doctor: Doctor;
  extension: DoctorProfileExtension | undefined;
}

const DISPLAYED_COLUMNS = [
  'name',
  'specialization',
  'languages',
  'displayPriority',
  'actions',
] as const;

/**
 * Presentational table over `DoctorProfileRow` - a join of `Doctor` (owned by
 * `DoctorService`) and its optional `DoctorProfileExtension` (owned by
 * `KnowledgeBaseService`). No doctor identity field is duplicated here; the
 * table only ever reads `doctor.*` for display and `extension.*` for the
 * knowledge-base-only fields.
 */
@Component({
  selector: 'app-doctor-profile-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './doctor-profile-table.html',
  styleUrl: './doctor-profile-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorProfileTable implements AfterViewInit {
  readonly rows = input.required<DoctorProfileRow[]>();

  readonly edit = output<DoctorProfileRow>();

  private readonly sort = viewChild.required(MatSort);
  private readonly paginator = viewChild.required(MatPaginator);

  readonly displayedColumns = DISPLAYED_COLUMNS;
  readonly dataSource = new MatTableDataSource<DoctorProfileRow>([]);

  constructor() {
    effect(() => {
      this.dataSource.data = this.rows();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort();
    this.dataSource.paginator = this.paginator();
  }
}
