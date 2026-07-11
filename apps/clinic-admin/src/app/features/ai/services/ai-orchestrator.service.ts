import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AiDashboardStats,
  AiExecutionHistory,
  AiExecutionResult,
  AiProviderHealth,
  GenerateRequest,
} from '../models/ai-execution.model';
import { AiConversationContext } from '../models/ai-context.model';
import { Prompt } from '../models/prompt.model';
import { PromptTemplateType } from '../models/prompt-template.model';

/**
 * Sprint 17 - talks to apps/api-server's AIOrchestratorModule (mounted at
 * `${apiBaseUrl}/ai`). Sprint 18: `generate()` now runs a real AI provider
 * call server-side (Gemini as of Sprint 24 - see apps/api-server/src/gemini/)
 * - Angular still never calls an AI provider directly, only this backend.
 * The provider/model shown anywhere in this app (e.g. the Automation
 * dashboard) comes straight from that backend response, never hardcoded
 * here. Same signal-plus-Observable
 * shape AutomationService/DoctorService established: readonly signals for
 * state that multiple components share (execution history, dashboard stats,
 * provider health), plain Observable-returning methods for one-off reads
 * (context/prompt preview) that only one component needs at a time.
 */
@Injectable({ providedIn: 'root' })
export class AiOrchestratorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/ai`;

  private readonly _history = signal<AiExecutionHistory[]>([]);
  private readonly _stats = signal<AiDashboardStats | null>(null);
  private readonly _providerHealth = signal<AiProviderHealth | null>(null);

  readonly history = this._history.asReadonly();
  readonly stats = this._stats.asReadonly();
  readonly providerHealth = this._providerHealth.asReadonly();
  readonly executionsToday = computed(() => this._stats()?.executionsToday ?? 0);
  readonly averageLatencyMs = computed(() => this._stats()?.averageLatencyMs ?? 0);

  constructor() {
    this.getStats().subscribe();
    this.getProviderHealth().subscribe();
  }

  getContext(conversationId: string): Observable<AiConversationContext> {
    return this.http.get<AiConversationContext>(`${this.baseUrl}/context/${conversationId}`);
  }

  getPromptPreview(
    conversationId: string,
    templateType?: PromptTemplateType,
    userQuestion?: string,
  ): Observable<Prompt> {
    const params: Record<string, string> = {};
    if (templateType) {
      params['templateType'] = templateType;
    }
    if (userQuestion) {
      params['userQuestion'] = userQuestion;
    }
    return this.http.get<Prompt>(`${this.baseUrl}/prompt/${conversationId}`, { params });
  }

  generate(request: GenerateRequest): Observable<AiExecutionResult> {
    return this.http
      .post<AiExecutionResult>(`${this.baseUrl}/generate`, request)
      .pipe(tap(() => this.getStats().subscribe()));
  }

  getHistory(conversationId?: string, limit = 50): Observable<AiExecutionHistory[]> {
    const params: Record<string, string | number> = { limit };
    if (conversationId) {
      params['conversationId'] = conversationId;
    }
    return this.http
      .get<AiExecutionHistory[]>(`${this.baseUrl}/history`, { params })
      .pipe(tap((history) => this._history.set(history)));
  }

  getStats(): Observable<AiDashboardStats> {
    return this.http
      .get<AiDashboardStats>(`${this.baseUrl}/stats`)
      .pipe(tap((stats) => this._stats.set(stats)));
  }

  getProviderHealth(): Observable<AiProviderHealth> {
    return this.http
      .get<AiProviderHealth>(`${this.baseUrl}/provider/health`)
      .pipe(tap((health) => this._providerHealth.set(health)));
  }
}
