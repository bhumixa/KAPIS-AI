import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Inquiry } from '../models/inquiry.model';

/**
 * Sprint 25 - talks to apps/api-server's InquiriesModule (mounted at
 * `${apiBaseUrl}/inquiries`), read-only (Inquiries are only ever
 * system-created/converted by the backend - see InquiriesController's doc
 * comment). Same eager-load-on-construct signal shape PatientService/
 * DoctorService already use.
 */
@Injectable({ providedIn: 'root' })
export class InquiryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/inquiries`;

  private readonly _inquiries = signal<Inquiry[]>([]);

  readonly inquiries = this._inquiries.asReadonly();
  readonly inquiryCount = computed(() => this._inquiries().length);
  readonly openInquiryCount = computed(
    () => this._inquiries().filter((inquiry) => inquiry.status === 'open').length,
  );

  constructor() {
    this.getInquiries().subscribe();
  }

  getInquiries(): Observable<Inquiry[]> {
    return this.http.get<Inquiry[]>(this.baseUrl).pipe(tap((inquiries) => this._inquiries.set(inquiries)));
  }
}
