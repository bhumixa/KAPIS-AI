import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Observable, map } from 'rxjs';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { MiniBarChart } from '../../components/mini-bar-chart/mini-bar-chart';
import { CHART_GRANULARITIES, ChartGranularity } from '../../models/analytics-query.model';
import { AnalyticsService } from '../../services/analytics.service';
import {
  ReportView,
  toAiReportView,
  toAppointmentReportView,
  toAutomationReportView,
  toConversationReportView,
  toDoctorReportView,
  toGoogleCalendarReportView,
  toKnowledgeBaseReportView,
  toPatientReportView,
  toRevenueReportView,
  toWhatsappReportView,
} from './report-view.model';

type ReportOption =
  | 'appointments'
  | 'doctors'
  | 'patients'
  | 'revenue'
  | 'conversations'
  | 'automation'
  | 'ai'
  | 'whatsapp'
  | 'google-calendar'
  | 'knowledge-base';

const REPORT_OPTIONS: { value: ReportOption; label: string }[] = [
  { value: 'appointments', label: 'Appointments' },
  { value: 'doctors', label: 'Doctors' },
  { value: 'patients', label: 'Patients' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'conversations', label: 'Conversations' },
  { value: 'automation', label: 'Automation' },
  { value: 'ai', label: 'AI' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'google-calendar', label: 'Google Calendar' },
  { value: 'knowledge-base', label: 'Knowledge Base' },
];

/**
 * Sprint 23 - the "Reports" page: one report type at a time, filtered by the
 * brief's Filters section (Date Range, Doctor, Patient, Status, Department)
 * plus a chart granularity, rendered through the ReportView normalization in
 * report-view.model.ts so this component doesn't need nine near-duplicate
 * templates. Report/export requests both read the same filter signals -
 * Exports page is a separate page since it's a distinct action (download),
 * not another view of this data.
 */
@Component({
  selector: 'app-reports',
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MiniBarChart,
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reports {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly doctorService = inject(DoctorService);

  readonly doctors = this.doctorService.doctors;
  readonly reportOptions = REPORT_OPTIONS;
  readonly granularityOptions = CHART_GRANULARITIES;

  readonly reportType = signal<ReportOption>('appointments');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly doctorId = signal('');
  readonly patientId = signal('');
  readonly status = signal('');
  readonly department = signal('');
  readonly granularity = signal<ChartGranularity>('daily');

  readonly loading = signal(false);
  readonly view = signal<ReportView | null>(null);

  constructor() {
    this.runReport();
  }

  runReport(): void {
    this.loading.set(true);
    const query = {
      dateFrom: this.dateFrom() || undefined,
      dateTo: this.dateTo() || undefined,
      doctorId: this.doctorId() || undefined,
      patientId: this.patientId() || undefined,
      status: this.status() || undefined,
      department: this.department() || undefined,
      granularity: this.granularity(),
    };

    this.buildRequest(query).subscribe({
      next: (view) => {
        this.view.set(view);
        this.loading.set(false);
      },
      error: () => {
        this.view.set(null);
        this.loading.set(false);
      },
    });
  }

  private buildRequest(query: {
    dateFrom?: string;
    dateTo?: string;
    doctorId?: string;
    patientId?: string;
    status?: string;
    department?: string;
    granularity: ChartGranularity;
  }): Observable<ReportView> {
    switch (this.reportType()) {
      case 'appointments':
        return this.analyticsService.getAppointmentReport(query).pipe(map(toAppointmentReportView));
      case 'doctors':
        return this.analyticsService.getDoctorReport(query).pipe(map(toDoctorReportView));
      case 'patients':
        return this.analyticsService.getPatientReport(query).pipe(map(toPatientReportView));
      case 'revenue':
        return this.analyticsService.getRevenueReport(query).pipe(map(toRevenueReportView));
      case 'conversations':
        return this.analyticsService.getConversationReport(query).pipe(map(toConversationReportView));
      case 'automation':
        return this.analyticsService.getAutomationReport(query).pipe(map(toAutomationReportView));
      case 'ai':
        return this.analyticsService.getAiReport(query).pipe(map(toAiReportView));
      case 'whatsapp':
        return this.analyticsService.getWhatsappReport(query).pipe(map(toWhatsappReportView));
      case 'google-calendar':
        return this.analyticsService.getGoogleCalendarReport(query).pipe(map(toGoogleCalendarReportView));
      case 'knowledge-base':
        return this.analyticsService.getKnowledgeBaseReport().pipe(map(toKnowledgeBaseReportView));
    }
  }
}
