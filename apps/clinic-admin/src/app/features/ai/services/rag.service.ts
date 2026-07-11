import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { KnowledgeSearchResult, RagDashboardStats, RagHealth } from '../models/rag.model';

/**
 * Sprint 19 - talks to apps/api-server's RagModule (mounted at
 * `${apiBaseUrl}/rag`). Same signal-plus-Observable shape
 * AiOrchestratorService established: readonly signals for state the
 * Automation dashboard reads (health, stats), a plain Observable-returning
 * method for the one-off GET /rag/search read.
 */
@Injectable({ providedIn: 'root' })
export class RagService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/rag`;

  private readonly _health = signal<RagHealth | null>(null);
  private readonly _stats = signal<RagDashboardStats | null>(null);

  readonly health = this._health.asReadonly();
  readonly stats = this._stats.asReadonly();

  constructor() {
    this.getHealth().subscribe();
    this.getStats().subscribe();
  }

  getHealth(): Observable<RagHealth> {
    return this.http.get<RagHealth>(`${this.baseUrl}/health`).pipe(tap((health) => this._health.set(health)));
  }

  getStats(): Observable<RagDashboardStats> {
    return this.http.get<RagDashboardStats>(`${this.baseUrl}/stats`).pipe(tap((stats) => this._stats.set(stats)));
  }

  search(q: string, limit?: number): Observable<KnowledgeSearchResult[]> {
    const params: Record<string, string | number> = { q };
    if (limit) {
      params['limit'] = limit;
    }
    return this.http.get<KnowledgeSearchResult[]>(`${this.baseUrl}/search`, { params });
  }
}
