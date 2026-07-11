/** Mirrors apps/api-server's ExportReportDto/ReportExportDto REPORT_TYPES/EXPORT_FORMATS. */
export type ReportType =
  | 'appointments'
  | 'doctors'
  | 'patients'
  | 'conversations'
  | 'automation'
  | 'ai'
  | 'whatsapp'
  | 'google-calendar'
  | 'knowledge-base';

export const REPORT_TYPES: ReportType[] = [
  'appointments',
  'doctors',
  'patients',
  'conversations',
  'automation',
  'ai',
  'whatsapp',
  'google-calendar',
  'knowledge-base',
];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  appointments: 'Appointments',
  doctors: 'Doctors',
  patients: 'Patients',
  conversations: 'Conversations',
  automation: 'Automation',
  ai: 'AI',
  whatsapp: 'WhatsApp',
  'google-calendar': 'Google Calendar',
  'knowledge-base': 'Knowledge Base',
};

export type ExportFormat = 'csv' | 'excel' | 'pdf';
export const EXPORT_FORMATS: ExportFormat[] = ['csv', 'excel', 'pdf'];

/** Mirrors apps/api-server's ExportReportDto - POST /analytics/export request body. */
export interface ExportReportRequest {
  reportType: ReportType;
  format: ExportFormat;
  dateFrom?: string;
  dateTo?: string;
  doctorId?: string;
  patientId?: string;
  status?: string;
  department?: string;
  requestedBy?: string;
}

/** Mirrors apps/api-server's ReportExportDto - one clinic.report_exports row. */
export interface ReportExport {
  id: string;
  reportType: ReportType;
  format: ExportFormat;
  filters: Record<string, unknown>;
  status: 'completed' | 'failed';
  fileName: string;
  rowCount: number;
  requestedBy: string;
  errorMessage: string | null;
  createdAt: string;
}
