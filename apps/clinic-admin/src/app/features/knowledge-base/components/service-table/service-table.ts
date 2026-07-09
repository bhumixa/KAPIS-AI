import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClinicService } from '../../models/service.model';

const DISPLAYED_COLUMNS = [
  'name',
  'category',
  'durationMinutes',
  'price',
  'status',
  'actions',
] as const;

/** Presentational table: sorting/pagination owned here, same split as `UserTable`. */
@Component({
  selector: 'app-service-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    TitleCasePipe,
    DecimalPipe,
  ],
  templateUrl: './service-table.html',
  styleUrl: './service-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceTable implements AfterViewInit {
  readonly services = input.required<ClinicService[]>();

  readonly edit = output<ClinicService>();
  readonly delete = output<ClinicService>();

  private readonly sort = viewChild.required(MatSort);
  private readonly paginator = viewChild.required(MatPaginator);

  readonly displayedColumns = DISPLAYED_COLUMNS;
  readonly dataSource = new MatTableDataSource<ClinicService>([]);

  constructor() {
    effect(() => {
      this.dataSource.data = this.services();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort();
    this.dataSource.paginator = this.paginator();
  }
}
