import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import {
  INTEGRATION_STATUS_LABELS,
  IntegrationStatus,
} from '../../models/integration-status.model';

/** Presentational status pill reused by every integration config page, the Integrations Dashboard cards, and the main Dashboard's health row. */
@Component({
  selector: 'app-integration-status-chip',
  imports: [MatChipsModule],
  templateUrl: './integration-status-chip.html',
  styleUrl: './integration-status-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntegrationStatusChip {
  readonly status = input.required<IntegrationStatus>();

  readonly labels = INTEGRATION_STATUS_LABELS;
}
