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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MessageTemplate, MESSAGE_TEMPLATE_TYPE_LABELS } from '../../models/message-template.model';

const DISPLAYED_COLUMNS = ['name', 'type', 'subject', 'actions'] as const;

/** Presentational table: sorting/pagination owned here, same split as `UserTable`. */
@Component({
  selector: 'app-message-template-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './message-template-table.html',
  styleUrl: './message-template-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageTemplateTable implements AfterViewInit {
  readonly templates = input.required<MessageTemplate[]>();

  readonly edit = output<MessageTemplate>();
  readonly delete = output<MessageTemplate>();

  private readonly sort = viewChild.required(MatSort);
  private readonly paginator = viewChild.required(MatPaginator);

  readonly displayedColumns = DISPLAYED_COLUMNS;
  readonly typeLabels = MESSAGE_TEMPLATE_TYPE_LABELS;
  readonly dataSource = new MatTableDataSource<MessageTemplate>([]);

  constructor() {
    effect(() => {
      this.dataSource.data = this.templates();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort();
    this.dataSource.paginator = this.paginator();
  }

  typeLabel(type: MessageTemplate['type']): string {
    return this.typeLabels[type];
  }
}
