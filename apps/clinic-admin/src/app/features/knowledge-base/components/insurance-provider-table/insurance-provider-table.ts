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
import { InsuranceProvider } from '../../models/insurance-provider.model';

const DISPLAYED_COLUMNS = ['name', 'contactPerson', 'phone', 'email', 'status', 'actions'] as const;

/** Presentational table: sorting/pagination owned here, same split as `UserTable`. */
@Component({
  selector: 'app-insurance-provider-table',
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
  templateUrl: './insurance-provider-table.html',
  styleUrl: './insurance-provider-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsuranceProviderTable implements AfterViewInit {
  readonly providers = input.required<InsuranceProvider[]>();

  readonly edit = output<InsuranceProvider>();
  readonly delete = output<InsuranceProvider>();

  private readonly sort = viewChild.required(MatSort);
  private readonly paginator = viewChild.required(MatPaginator);

  readonly displayedColumns = DISPLAYED_COLUMNS;
  readonly dataSource = new MatTableDataSource<InsuranceProvider>([]);

  constructor() {
    effect(() => {
      this.dataSource.data = this.providers();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort();
    this.dataSource.paginator = this.paginator();
  }
}
