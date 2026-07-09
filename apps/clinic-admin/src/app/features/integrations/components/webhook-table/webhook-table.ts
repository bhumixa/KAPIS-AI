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
import { Webhook } from '../../models/webhook.model';

const DISPLAYED_COLUMNS = ['name', 'url', 'events', 'status', 'actions'] as const;

/** Presentational table: sorting/pagination owned here, same split as `UserTable`. */
@Component({
  selector: 'app-webhook-table',
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
  templateUrl: './webhook-table.html',
  styleUrl: './webhook-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebhookTable implements AfterViewInit {
  readonly webhooks = input.required<Webhook[]>();

  readonly edit = output<Webhook>();
  readonly delete = output<Webhook>();

  private readonly sort = viewChild.required(MatSort);
  private readonly paginator = viewChild.required(MatPaginator);

  readonly displayedColumns = DISPLAYED_COLUMNS;
  readonly dataSource = new MatTableDataSource<Webhook>([]);

  constructor() {
    effect(() => {
      this.dataSource.data = this.webhooks();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort();
    this.dataSource.paginator = this.paginator();
  }

  eventsTooltip(webhook: Webhook): string {
    return webhook.events.join(', ');
  }
}
