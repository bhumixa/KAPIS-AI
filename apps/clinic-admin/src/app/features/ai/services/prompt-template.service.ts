import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PromptTemplate, PromptTemplateInput } from '../models/prompt-template.model';

/**
 * Sprint 17 - talks to apps/api-server's PromptTemplatesController (mounted
 * at `${apiBaseUrl}/prompt-templates`, a top-level path, not nested under
 * `/ai` - see that controller's doc comment). Same signal-plus-Observable
 * shape every other CRUD service in this app uses (DoctorService, PatientService).
 */
@Injectable({ providedIn: 'root' })
export class PromptTemplateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/prompt-templates`;

  private readonly _templates = signal<PromptTemplate[]>([]);

  readonly templates = this._templates.asReadonly();
  readonly templateCount = computed(() => this._templates().length);

  constructor() {
    this.getTemplates().subscribe();
  }

  getTemplates(): Observable<PromptTemplate[]> {
    return this.http
      .get<PromptTemplate[]>(this.baseUrl)
      .pipe(tap((templates) => this._templates.set(templates)));
  }

  getTemplate(id: string): Observable<PromptTemplate> {
    return this.http.get<PromptTemplate>(`${this.baseUrl}/${id}`);
  }

  createTemplate(input: PromptTemplateInput): Observable<PromptTemplate> {
    return this.http
      .post<PromptTemplate>(this.baseUrl, input)
      .pipe(tap((created) => this._templates.update((templates) => [...templates, created])));
  }

  updateTemplate(id: string, input: Partial<PromptTemplateInput>): Observable<PromptTemplate> {
    return this.http
      .patch<PromptTemplate>(`${this.baseUrl}/${id}`, input)
      .pipe(
        tap((updated) =>
          this._templates.update((templates) => templates.map((t) => (t.id === id ? updated : t))),
        ),
      );
  }

  deleteTemplate(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(tap(() => this._templates.update((templates) => templates.filter((t) => t.id !== id))));
  }
}
