import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AnalyticsQuery } from '../models/analytics-query.model';
import { DashboardStats } from '../models/dashboard-stats.model';
import {
  AiAnalytics,
  AppointmentAnalytics,
  AutomationAnalytics,
  ConversationAnalytics,
  DoctorAnalytics,
  GoogleCalendarAnalytics,
  KnowledgeBaseAnalytics,
  PatientAnalytics,
  RevenueAnalytics,
  SystemStats,
  WhatsappAnalytics,
} from '../models/analytics-report.model';
import { ExportReportRequest, ReportExport } from '../models/report-export.model';

/**
 * Sprint 23 - talks to apps/api-server's AnalyticsModule (mounted at
 * `${apiBaseUrl}/analytics`). Same signal-plus-Observable shape
 * WorkflowRuntimeService established: readonly signals for the Dashboard
 * Analytics page's tiles, eagerly loaded in the constructor; report/export
 * calls are plain Observables the Reports/Exports pages subscribe to
 * on-demand (filters change per request, so there's no single "current"
 * value worth caching in a signal the way dashboard stats are).
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/analytics`;

  private readonly _dashboardStats = signal<DashboardStats | null>(null);
  private readonly _exports = signal<ReportExport[]>([]);

  readonly dashboardStats = this._dashboardStats.asReadonly();
  readonly exports = this._exports.asReadonly();

  constructor() {
    this.getDashboardStats().subscribe();
    this.listExports().subscribe();
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http
      .get<DashboardStats>(`${this.baseUrl}/dashboard`)
      .pipe(tap((stats) => this._dashboardStats.set(stats)));
  }

  getSystemStats(query: AnalyticsQuery = {}): Observable<SystemStats> {
    return this.http.get<SystemStats>(`${this.baseUrl}/system-stats`, { params: toHttpParams(query) });
  }

  getAppointmentReport(query: AnalyticsQuery = {}): Observable<AppointmentAnalytics> {
    return this.http.get<AppointmentAnalytics>(`${this.baseUrl}/reports/appointments`, {
      params: toHttpParams(query),
    });
  }

  getDoctorReport(query: AnalyticsQuery = {}): Observable<DoctorAnalytics> {
    return this.http.get<DoctorAnalytics>(`${this.baseUrl}/reports/doctors`, { params: toHttpParams(query) });
  }

  getPatientReport(query: AnalyticsQuery = {}): Observable<PatientAnalytics> {
    return this.http.get<PatientAnalytics>(`${this.baseUrl}/reports/patients`, { params: toHttpParams(query) });
  }

  getRevenueReport(query: AnalyticsQuery = {}): Observable<RevenueAnalytics> {
    return this.http.get<RevenueAnalytics>(`${this.baseUrl}/reports/revenue`, { params: toHttpParams(query) });
  }

  getConversationReport(query: AnalyticsQuery = {}): Observable<ConversationAnalytics> {
    return this.http.get<ConversationAnalytics>(`${this.baseUrl}/reports/conversations`, {
      params: toHttpParams(query),
    });
  }

  getAutomationReport(query: AnalyticsQuery = {}): Observable<AutomationAnalytics> {
    return this.http.get<AutomationAnalytics>(`${this.baseUrl}/reports/automation`, {
      params: toHttpParams(query),
    });
  }

  getAiReport(query: AnalyticsQuery = {}): Observable<AiAnalytics> {
    return this.http.get<AiAnalytics>(`${this.baseUrl}/reports/ai`, { params: toHttpParams(query) });
  }

  getWhatsappReport(query: AnalyticsQuery = {}): Observable<WhatsappAnalytics> {
    return this.http.get<WhatsappAnalytics>(`${this.baseUrl}/reports/whatsapp`, { params: toHttpParams(query) });
  }

  getGoogleCalendarReport(query: AnalyticsQuery = {}): Observable<GoogleCalendarAnalytics> {
    return this.http.get<GoogleCalendarAnalytics>(`${this.baseUrl}/reports/google-calendar`, {
      params: toHttpParams(query),
    });
  }

  getKnowledgeBaseReport(): Observable<KnowledgeBaseAnalytics> {
    return this.http.get<KnowledgeBaseAnalytics>(`${this.baseUrl}/reports/knowledge-base`);
  }

  listExports(): Observable<ReportExport[]> {
    return this.http
      .get<ReportExport[]>(`${this.baseUrl}/exports`)
      .pipe(tap((exports) => this._exports.set(exports)));
  }

  /** Generates the file and refreshes the history list - filename comes from the server's Content-Disposition header so it always matches clinic.report_exports.file_name. */
  export(request: ExportReportRequest): Observable<{ blob: Blob; fileName: string }> {
    return this.http
      .post(`${this.baseUrl}/export`, request, { responseType: 'blob', observe: 'response' })
      .pipe(
        map((response) => ({
          blob: response.body as Blob,
          fileName: extractFileName(response.headers.get('content-disposition')) ?? 'export',
        })),
        tap(() => this.listExports().subscribe()),
      );
  }
}

function extractFileName(contentDisposition: string | null): string | null {
  const match = contentDisposition?.match(/filename="([^"]+)"/);
  return match ? match[1] : null;
}

function toHttpParams(query: AnalyticsQuery): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}
