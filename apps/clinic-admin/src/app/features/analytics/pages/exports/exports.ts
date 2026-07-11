import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { EXPORT_FORMATS, ExportFormat, REPORT_TYPES, REPORT_TYPE_LABELS, ReportType } from '../../models/report-export.model';
import { AnalyticsService } from '../../services/analytics.service';

/**
 * Sprint 23 - the "Exports" page: generates a CSV/Excel/PDF for any of the
 * nine export-eligible report types (Revenue has no billing module backing
 * it consistently enough to export - see Reports page instead) and triggers
 * a browser download, then lists clinic.report_exports history via
 * AnalyticsService.exports (GET /api/analytics/exports).
 */
@Component({
  selector: 'app-exports',
  imports: [
    DatePipe,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './exports.html',
  styleUrl: './exports.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Exports {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly doctorService = inject(DoctorService);
  private readonly snackBar = inject(MatSnackBar);

  readonly doctors = this.doctorService.doctors;
  readonly exports = this.analyticsService.exports;
  readonly reportTypes = REPORT_TYPES;
  readonly reportTypeLabels = REPORT_TYPE_LABELS;
  readonly formats = EXPORT_FORMATS;

  readonly reportType = signal<ReportType>('appointments');
  readonly format = signal<ExportFormat>('csv');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly doctorId = signal('');
  readonly patientId = signal('');
  readonly status = signal('');
  readonly department = signal('');
  readonly requestedBy = signal('');

  readonly exporting = signal(false);

  readonly historyColumns = ['createdAt', 'reportType', 'format', 'status', 'rowCount', 'fileName'];

  reportTypeLabel(type: ReportType): string {
    return REPORT_TYPE_LABELS[type];
  }

  generate(): void {
    this.exporting.set(true);
    this.analyticsService
      .export({
        reportType: this.reportType(),
        format: this.format(),
        dateFrom: this.dateFrom() || undefined,
        dateTo: this.dateTo() || undefined,
        doctorId: this.doctorId() || undefined,
        patientId: this.patientId() || undefined,
        status: this.status() || undefined,
        department: this.department() || undefined,
        requestedBy: this.requestedBy() || undefined,
      })
      .subscribe({
        next: ({ blob, fileName }) => {
          this.exporting.set(false);
          downloadBlob(blob, fileName);
          this.snackBar.open(`"${fileName}" downloaded.`, 'Dismiss', { duration: 3000 });
        },
        error: () => {
          this.exporting.set(false);
          this.snackBar.open('Export failed.', 'Dismiss', { duration: 3000 });
        },
      });
  }
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
