import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { WorkflowExecution } from '../models/workflow-execution.model';
import { WorkflowDefinition } from '../models/workflow.model';

/**
 * Sprint 14 - talks to apps/api-server's N8nModule (mounted at
 * `${apiBaseUrl}/n8n`), which itself never calls n8n; every "Run" trigger
 * resolves to a mock execution the backend built and returned. This service
 * has no mock branch of its own - unlike Sprint 1-13's feature services,
 * there was no pre-existing Automation UI to migrate off mock data (Sprint
 * 14 is this feature's first implementation), so it's real `HttpClient`
 * calls from the start, following the shape DoctorService established
 * (readonly signals + Observable-returning methods that `tap()` the signal).
 */
@Injectable({ providedIn: 'root' })
export class AutomationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/n8n`;

  private readonly _workflows = signal<WorkflowDefinition[]>([]);
  private readonly _recentExecutions = signal<WorkflowExecution[]>([]);

  readonly workflows = this._workflows.asReadonly();
  readonly recentExecutions = this._recentExecutions.asReadonly();
  readonly workflowCount = computed(() => this._workflows().length);

  constructor() {
    this.getWorkflows().subscribe();
    this.getRecentExecutions().subscribe();
  }

  getWorkflows(): Observable<WorkflowDefinition[]> {
    return this.http
      .get<WorkflowDefinition[]>(`${this.baseUrl}/workflows`)
      .pipe(tap((workflows) => this._workflows.set(workflows)));
  }

  getRecentExecutions(): Observable<WorkflowExecution[]> {
    return this.http
      .get<WorkflowExecution[]>(`${this.baseUrl}/executions/recent`)
      .pipe(tap((executions) => this._recentExecutions.set(executions)));
  }

  // "Run" action: triggers the backend's mock execution endpoint, then
  // refreshes the recent-executions list so the dashboard's history reflects
  // this run without a manual page reload.
  triggerWorkflow(id: string): Observable<WorkflowExecution> {
    return this.http.post<WorkflowExecution>(`${this.baseUrl}/workflows/${id}/trigger`, {}).pipe(
      tap((execution) => {
        this._recentExecutions.update((executions) => [execution, ...executions]);
      }),
    );
  }
}
