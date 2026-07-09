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
import { ClinicUser } from '../../models/clinic-user.model';

const DISPLAYED_COLUMNS = ['name', 'email', 'phone', 'role', 'status', 'actions'] as const;

/** Presentational table: sorting/pagination owned here, same split as `DoctorTable`/`PatientTable`. */
@Component({
  selector: 'app-user-table',
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
  templateUrl: './user-table.html',
  styleUrl: './user-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserTable implements AfterViewInit {
  readonly users = input.required<ClinicUser[]>();

  readonly edit = output<ClinicUser>();
  readonly delete = output<ClinicUser>();

  private readonly sort = viewChild.required(MatSort);
  private readonly paginator = viewChild.required(MatPaginator);

  readonly displayedColumns = DISPLAYED_COLUMNS;
  readonly dataSource = new MatTableDataSource<ClinicUser>([]);

  constructor() {
    effect(() => {
      this.dataSource.data = this.users();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort();
    this.dataSource.paginator = this.paginator();
  }
}
