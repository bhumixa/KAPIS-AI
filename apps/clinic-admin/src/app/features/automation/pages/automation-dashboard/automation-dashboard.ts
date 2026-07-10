import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { AutomationService } from '../../services/automation.service';
import { WORKFLOW_CATEGORY_LABELS } from '../../models/workflow.model';

/**
 * The Automation Center's first page (Sprint 14). Lists every registered
 * workflow with a "Run" action that calls apps/api-server's mock trigger
 * endpoint, plus a recent-executions log so a run's (mocked) result is
 * visible without leaving the page. No workflow here actually does
 * anything yet - see docs/Architecture.md.
 */
@Component({
  selector: 'app-automation-dashboard',
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './automation-dashboard.html',
  styleUrl: './automation-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutomationDashboard {
  private readonly automationService = inject(AutomationService);
  private readonly snackBar = inject(MatSnackBar);

  readonly workflows = this.automationService.workflows;
  readonly recentExecutions = this.automationService.recentExecutions;
  readonly categoryLabels = WORKFLOW_CATEGORY_LABELS;

  readonly runningWorkflowId = signal<string | null>(null);

  readonly executionColumns = ['workflowId', 'status', 'triggeredAt', 'completedAt'];

  run(workflowId: string): void {
    if (this.runningWorkflowId()) {
      return;
    }

    this.runningWorkflowId.set(workflowId);

    this.automationService.triggerWorkflow(workflowId).subscribe({
      next: () => {
        this.runningWorkflowId.set(null);
        this.snackBar.open(`"${workflowId}" run queued (mock execution).`, 'Dismiss', {
          duration: 3000,
        });
      },
      error: () => {
        this.runningWorkflowId.set(null);
        this.snackBar.open(`Could not trigger "${workflowId}".`, 'Dismiss', { duration: 3000 });
      },
    });
  }
}
