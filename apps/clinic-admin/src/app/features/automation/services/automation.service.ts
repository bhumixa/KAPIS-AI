import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { N8nHealth } from '../models/n8n-health.model';
import { WorkflowExecution } from '../models/workflow-execution.model';
import { WorkflowDefinition } from '../models/workflow.model';

/**
 * Sprint 15 - talks to apps/api-server's N8nModule (mounted at
 * `${apiBaseUrl}/n8n`), which now calls the real n8n instance: "Run" triggers
 * n8n's actual webhook, "Import" imports+activates a workflow in n8n, and
 * execution history comes from Postgres instead of an in-memory mock list
 * (Sprint 14). Same shape DoctorService established: readonly signals +
 * Observable-returning methods that `tap()` the signal.
 */
@Injectable({ providedIn: 'root' })
export class AutomationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/n8n`;

  private readonly _workflows = signal<WorkflowDefinition[]>([]);
  private readonly _recentExecutions = signal<WorkflowExecution[]>([]);
  private readonly _health = signal<N8nHealth | null>(null);

  readonly workflows = this._workflows.asReadonly();
  readonly recentExecutions = this._recentExecutions.asReadonly();
  readonly health = this._health.asReadonly();
  readonly workflowCount = computed(() => this._workflows().length);

  /** Most recent execution per workflow id, for the "last execution"/"duration" columns on each card. */
  readonly lastExecutionByWorkflowId = computed(() => {
    const map = new Map<string, WorkflowExecution>();
    for (const execution of this._recentExecutions()) {
      if (!map.has(execution.workflowId)) {
        map.set(execution.workflowId, execution);
      }
    }
    return map;
  });

  constructor() {
    this.getWorkflows().subscribe();
    this.getRecentExecutions().subscribe();
    this.getHealth().subscribe();
  }

  getWorkflows(): Observable<WorkflowDefinition[]> {
    return this.http
      .get<WorkflowDefinition[]>(`${this.baseUrl}/workflows`)
      .pipe(tap((workflows) => this._workflows.set(workflows)));
  }

  getRecentExecutions(limit = 50): Observable<WorkflowExecution[]> {
    return this.http
      .get<WorkflowExecution[]>(`${this.baseUrl}/executions/recent`, { params: { limit } })
      .pipe(tap((executions) => this._recentExecutions.set(executions)));
  }

  getHealth(): Observable<N8nHealth> {
    return this.http.get<N8nHealth>(`${this.baseUrl}/health`).pipe(tap((health) => this._health.set(health)));
  }

  // "Run" action: calls the real trigger endpoint (which itself calls n8n's
  // webhook), then refreshes the recent-executions list and health (a
  // successful trigger updates lastSuccessfulConnection).
  triggerWorkflow(id: string): Observable<WorkflowExecution> {
    return this.http.post<WorkflowExecution>(`${this.baseUrl}/workflows/${id}/trigger`, {}).pipe(
      tap((execution) => {
        this._recentExecutions.update((executions) => [execution, ...executions]);
        this.getHealth().subscribe();
      }),
    );
  }

  // "Import" action: imports+activates the workflow in n8n, then refreshes the
  // workflow list so the card picks up the new n8nWorkflowId/active state.
  importWorkflow(id: string): Observable<WorkflowDefinition> {
    return this.http.post<WorkflowDefinition>(`${this.baseUrl}/workflows/import/${id}`, {}).pipe(
      tap((updated) => {
        this._workflows.update((workflows) => workflows.map((w) => (w.id === updated.id ? updated : w)));
      }),
    );
  }
}
