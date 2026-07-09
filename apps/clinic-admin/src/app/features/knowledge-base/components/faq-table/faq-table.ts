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
import { Faq } from '../../models/faq.model';

const DISPLAYED_COLUMNS = ['question', 'category', 'status', 'actions'] as const;

/** Presentational table: sorting/pagination owned here, same split as `UserTable`. */
@Component({
  selector: 'app-faq-table',
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
  templateUrl: './faq-table.html',
  styleUrl: './faq-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqTable implements AfterViewInit {
  readonly faqs = input.required<Faq[]>();

  readonly edit = output<Faq>();
  readonly delete = output<Faq>();

  private readonly sort = viewChild.required(MatSort);
  private readonly paginator = viewChild.required(MatPaginator);

  readonly displayedColumns = DISPLAYED_COLUMNS;
  readonly dataSource = new MatTableDataSource<Faq>([]);

  constructor() {
    effect(() => {
      this.dataSource.data = this.faqs();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort();
    this.dataSource.paginator = this.paginator();
  }
}
