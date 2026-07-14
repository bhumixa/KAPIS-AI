import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { WorkflowRuntimeExecution } from '../models/workflow-runtime-execution.model';
import { WorkflowRuntimeHealth } from '../models/workflow-runtime-health.model';
import { WorkflowRuntimeStats } from '../models/workflow-runtime-stats.model';

/**
 * Sprint 21 - talks to apps/api-server's WorkflowRuntimeModule (mounted at
 * `${apiBaseUrl}/workflow-runtime`), which wires the Conversation Engine, AI
 * Orchestrator, WhatsApp integration, and n8n into one automatic end-to-end
 * flow. Same signal-plus-Observable shape AutomationService/RagService
 * already established: readonly signals for the dashboard's stats/health
 * tiles, eagerly loaded in the constructor. Read-only - there's no
 * "trigger" action here, the pipeline runs automatically off an incoming
 * WhatsApp message.
 */
@Injectable({ providedIn: 'root' })
export class WorkflowRuntimeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/workflow-runtime`;

  private readonly _stats = signal<WorkflowRuntimeStats | null>(null);
  private readonly _health = signal<WorkflowRuntimeHealth | null>(null);
  private readonly _recentExecutions = signal<WorkflowRuntimeExecution[]>([]);

  readonly stats = this._stats.asReadonly();
  readonly health = this._health.asReadonly();
  readonly recentExecutions = this._recentExecutions.asReadonly();

  constructor() {
    this.getStats().subscribe();
    this.getHealth().subscribe();
    this.getRecentExecutions().subscribe();
  }

  getStats(): Observable<WorkflowRuntimeStats> {
    return this.http.get<WorkflowRuntimeStats>(`${this.baseUrl}/stats`).pipe(tap((stats) => this._stats.set(stats)));
  }

  getHealth(): Observable<WorkflowRuntimeHealth> {
    return this.http
      .get<WorkflowRuntimeHealth>(`${this.baseUrl}/health`)
      .pipe(tap((health) => this._health.set(health)));
  }

  getRecentExecutions(limit = 20): Observable<WorkflowRuntimeExecution[]> {
    return this.http
      .get<WorkflowRuntimeExecution[]>(`${this.baseUrl}/executions`, { params: { limit } })
      .pipe(tap((executions) => this._recentExecutions.set(executions)));
  }

  // Sprint 25 - powers the Conversation Details "AI Insights" card's Workflow
  // Status pill. Deliberately doesn't touch `_recentExecutions` (that signal
  // is the dashboard's global feed) - callers read the Observable result directly.
  getExecutionsForConversation(conversationId: string, limit = 5): Observable<WorkflowRuntimeExecution[]> {
    return this.http.get<WorkflowRuntimeExecution[]>(`${this.baseUrl}/executions`, {
      params: { conversationId, limit },
    });
  }
}
