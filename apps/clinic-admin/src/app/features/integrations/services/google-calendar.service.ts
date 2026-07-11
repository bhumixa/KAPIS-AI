import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CalendarConnection } from '../models/calendar-connection.model';
import { CalendarEvent } from '../models/calendar-event.model';
import { CalendarHealth } from '../models/calendar-health.model';
import { CalendarStats } from '../models/calendar-stats.model';
import { CalendarSyncLog } from '../models/calendar-sync-log.model';

/**
 * Sprint 22 - talks to apps/api-server's GoogleCalendarModule (mounted at
 * `${apiBaseUrl}/google-calendar`). Same signal-plus-Observable shape
 * WorkflowRuntimeService (features/automation) established: readonly
 * signals for the Connection/Sync Status/Sync History pages and the
 * Automation Dashboard's three tiles, eagerly loaded in the constructor.
 * connect()/disconnect() are the only actions that leave this service -
 * connect() is a real browser navigation (Google's consent screen is not an
 * XHR target), everything else is a normal HttpClient call.
 */
@Injectable({ providedIn: 'root' })
export class GoogleCalendarService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/google-calendar`;

  private readonly _connection = signal<CalendarConnection | null>(null);
  private readonly _health = signal<CalendarHealth | null>(null);
  private readonly _stats = signal<CalendarStats | null>(null);
  private readonly _syncHistory = signal<CalendarSyncLog[]>([]);

  readonly connection = this._connection.asReadonly();
  readonly health = this._health.asReadonly();
  readonly stats = this._stats.asReadonly();
  readonly syncHistory = this._syncHistory.asReadonly();

  constructor() {
    this.getConnection().subscribe();
    this.getHealth().subscribe();
    this.getStats().subscribe();
    this.getSyncHistory().subscribe();
  }

  getConnection(): Observable<CalendarConnection> {
    return this.http
      .get<CalendarConnection>(`${this.baseUrl}/connection`)
      .pipe(tap((connection) => this._connection.set(connection)));
  }

  getHealth(): Observable<CalendarHealth> {
    return this.http.get<CalendarHealth>(`${this.baseUrl}/health`).pipe(tap((health) => this._health.set(health)));
  }

  getStats(): Observable<CalendarStats> {
    return this.http.get<CalendarStats>(`${this.baseUrl}/stats`).pipe(tap((stats) => this._stats.set(stats)));
  }

  getSyncHistory(appointmentId?: string, limit = 50): Observable<CalendarSyncLog[]> {
    const params: Record<string, string | number> = { limit };
    if (appointmentId) {
      params['appointmentId'] = appointmentId;
    }
    return this.http
      .get<CalendarSyncLog[]>(`${this.baseUrl}/sync-history`, { params })
      .pipe(tap((history) => this._syncHistory.set(history)));
  }

  getEventForAppointment(appointmentId: string): Observable<CalendarEvent | null> {
    return this.http.get<CalendarEvent | null>(`${this.baseUrl}/events/${appointmentId}`);
  }

  /** Navigates the whole browser tab to Google's consent screen - the OAuth redirect flow needs a real navigation, not an XHR. */
  connect(): void {
    window.location.href = `${this.baseUrl}/oauth/connect`;
  }

  disconnect(): Observable<{ disconnected: true }> {
    return this.http
      .post<{ disconnected: true }>(`${this.baseUrl}/disconnect`, {})
      .pipe(tap(() => this.refreshAll()));
  }

  refreshToken(): Observable<CalendarConnection> {
    return this.http
      .post<CalendarConnection>(`${this.baseUrl}/refresh-token`, {})
      .pipe(tap((connection) => this._connection.set(connection)));
  }

  syncNow(appointmentId: string): Observable<{ synced: true }> {
    return this.http
      .post<{ synced: true }>(`${this.baseUrl}/sync/${appointmentId}`, {})
      .pipe(tap(() => this.refreshAll()));
  }

  private refreshAll(): void {
    this.getConnection().subscribe();
    this.getHealth().subscribe();
    this.getStats().subscribe();
    this.getSyncHistory().subscribe();
  }
}
