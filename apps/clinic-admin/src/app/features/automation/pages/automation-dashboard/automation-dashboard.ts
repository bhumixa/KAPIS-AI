import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AiOrchestratorService } from '../../../ai/services/ai-orchestrator.service';
import { PromptTemplateService } from '../../../ai/services/prompt-template.service';
import { RagService } from '../../../ai/services/rag.service';
import { AutomationService } from '../../services/automation.service';
import { WorkflowRuntimeService } from '../../services/workflow-runtime.service';
import { WORKFLOW_CATEGORY_LABELS } from '../../models/workflow.model';

/**
 * The Automation Center's dashboard. Lists every registered workflow with an
 * "Import" action (imports+activates it in n8n) and a "Run" action (calls the
 * real n8n webhook), plus a health strip and a Postgres-backed execution
 * history (Sprint 15) - Sprint 14's mocked trigger/in-memory history are gone.
 * Sprint 17 added an AI Orchestration Engine stats strip (executions today,
 * average latency, prompt template count) sourced from AiOrchestratorService/
 * PromptTemplateService. Sprint 18 extends it with the real Claude provider's
 * name/model, today's token usage, success rate, and a reachability chip
 * (same "configured vs. reachable" shape the n8n health chips already use).
 * Sprint 19 adds the RAG Engine's indexed document count, average search
 * latency, and average result count, sourced from RagService. Sprint 21
 * adds the end-to-end Workflow Runtime's Running/Completed/Failed/Success
 * Rate/average latency tiles, an aggregate AI+WhatsApp+n8n+Database health
 * strip, and a "Recent Pipeline Runs" table, sourced from
 * WorkflowRuntimeService - the automatic pipeline itself has no manual
 * trigger button, it runs off every incoming WhatsApp message.
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
    MatTooltipModule,
  ],
  templateUrl: './automation-dashboard.html',
  styleUrl: './automation-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutomationDashboard {
  private readonly automationService = inject(AutomationService);
  private readonly aiService = inject(AiOrchestratorService);
  private readonly promptTemplateService = inject(PromptTemplateService);
  private readonly ragService = inject(RagService);
  private readonly workflowRuntimeService = inject(WorkflowRuntimeService);
  private readonly snackBar = inject(MatSnackBar);

  readonly workflows = this.automationService.workflows;
  readonly recentExecutions = this.automationService.recentExecutions;
  readonly health = this.automationService.health;
  readonly lastExecutionByWorkflowId = this.automationService.lastExecutionByWorkflowId;
  readonly categoryLabels = WORKFLOW_CATEGORY_LABELS;

  readonly aiExecutionsToday = this.aiService.executionsToday;
  readonly aiAverageLatencyMs = this.aiService.averageLatencyMs;
  readonly promptTemplateCount = this.promptTemplateService.templateCount;
  readonly aiStats = this.aiService.stats;
  readonly aiProviderHealth = this.aiService.providerHealth;

  readonly ragStats = this.ragService.stats;
  readonly ragHealth = this.ragService.health;

  readonly workflowRuntimeStats = this.workflowRuntimeService.stats;
  readonly workflowRuntimeHealth = this.workflowRuntimeService.health;
  readonly workflowRuntimeExecutions = this.workflowRuntimeService.recentExecutions;

  readonly runningWorkflowId = signal<string | null>(null);
  readonly importingWorkflowId = signal<string | null>(null);

  readonly executionColumns = ['workflowName', 'status', 'startedAt', 'durationMs', 'errorMessage'];

  readonly healthChips = computed(() => {
    const health = this.health();
    if (!health) {
      return null;
    }
    return [
      { label: health.reachable ? 'n8n reachable' : 'n8n unreachable', ok: health.reachable },
      {
        label: health.apiConfigured ? 'API key configured' : 'API key not set',
        ok: health.apiConfigured,
      },
      { label: `${health.registeredWorkflowCount} workflow(s)`, ok: true },
    ];
  });

  readonly aiHealthChips = computed(() => {
    const health = this.aiProviderHealth();
    if (!health) {
      return null;
    }
    return [
      {
        label: health.configured ? 'Claude API key configured' : 'Claude API key not set',
        ok: health.configured,
      },
      { label: health.reachable ? 'Claude reachable' : 'Claude unreachable', ok: health.reachable },
    ];
  });

  readonly ragHealthChips = computed(() => {
    const health = this.ragHealth();
    if (!health) {
      return null;
    }
    return [
      { label: health.enabled ? 'RAG search enabled' : 'RAG search not migrated', ok: health.enabled },
      { label: `${health.indexedSources.length} source(s) indexed`, ok: health.indexedSources.length > 0 },
    ];
  });

  readonly workflowRuntimeHealthChips = computed(() => {
    const health = this.workflowRuntimeHealth();
    if (!health) {
      return null;
    }
    return [
      { label: `Pipeline ${health.status}`, ok: health.status === 'ok' },
      { label: health.ai.reachable ? 'AI reachable' : 'AI unreachable', ok: health.ai.reachable },
      { label: health.whatsapp.reachable ? 'WhatsApp reachable' : 'WhatsApp unreachable', ok: health.whatsapp.reachable },
      { label: health.n8n.reachable ? 'n8n reachable' : 'n8n unreachable', ok: health.n8n.reachable },
      { label: health.database === 'up' ? 'Database up' : 'Database down', ok: health.database === 'up' },
    ];
  });

  readonly workflowRuntimeColumns = ['conversationId', 'decision', 'status', 'durationMs', 'startedAt'];

  run(workflowId: string): void {
    if (this.runningWorkflowId()) {
      return;
    }

    this.runningWorkflowId.set(workflowId);

    this.automationService.triggerWorkflow(workflowId).subscribe({
      next: (execution) => {
        this.runningWorkflowId.set(null);
        const message =
          execution.status === 'success'
            ? `"${workflowId}" ran successfully (${execution.durationMs}ms).`
            : `"${workflowId}" failed: ${execution.errorMessage}`;
        this.snackBar.open(message, 'Dismiss', { duration: 4000 });
      },
      error: () => {
        this.runningWorkflowId.set(null);
        this.snackBar.open(`Could not trigger "${workflowId}".`, 'Dismiss', { duration: 3000 });
      },
    });
  }

  import(workflowId: string): void {
    if (this.importingWorkflowId()) {
      return;
    }

    this.importingWorkflowId.set(workflowId);

    this.automationService.importWorkflow(workflowId).subscribe({
      next: () => {
        this.importingWorkflowId.set(null);
        this.snackBar.open(`"${workflowId}" imported and activated in n8n.`, 'Dismiss', {
          duration: 3000,
        });
      },
      error: (error: HttpErrorResponse) => {
        this.importingWorkflowId.set(null);
        const message = (error.error as { message?: string } | null)?.message;
        this.snackBar.open(message ?? `Could not import "${workflowId}".`, 'Dismiss', {
          duration: 4000,
        });
      },
    });
  }
}
