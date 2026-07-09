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
import { Policy } from '../../models/policy.model';

const DISPLAYED_COLUMNS = ['title', 'type', 'status', 'actions'] as const;

/** Presentational table: sorting/pagination owned here, same split as `UserTable`. */
@Component({
  selector: 'app-policy-table',
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
  templateUrl: './policy-table.html',
  styleUrl: './policy-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolicyTable implements AfterViewInit {
  readonly policies = input.required<Policy[]>();

  readonly edit = output<Policy>();
  readonly delete = output<Policy>();

  private readonly sort = viewChild.required(MatSort);
  private readonly paginator = viewChild.required(MatPaginator);

  readonly displayedColumns = DISPLAYED_COLUMNS;
  readonly dataSource = new MatTableDataSource<Policy>([]);

  constructor() {
    effect(() => {
      this.dataSource.data = this.policies();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort();
    this.dataSource.paginator = this.paginator();
  }
}
