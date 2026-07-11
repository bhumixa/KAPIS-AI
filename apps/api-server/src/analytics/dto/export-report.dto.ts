import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';

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

export type ExportFormat = 'csv' | 'excel' | 'pdf';
export const EXPORT_FORMATS: ExportFormat[] = ['csv', 'excel', 'pdf'];

/** POST /api/analytics/export request body - the Sprint 23 "Export" section (CSV/Excel/PDF) applied to any of the nine report types, using the same filter set the report endpoints themselves accept. */
export class ExportReportDto {
  @ApiProperty({ enum: REPORT_TYPES })
  @IsIn(REPORT_TYPES)
  reportType!: ReportType;

  @ApiProperty({ enum: EXPORT_FORMATS })
  @IsIn(EXPORT_FORMATS)
  format!: ExportFormat;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601({ strict: true })
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601({ strict: true })
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Staff member name/email requesting the export, for the history table - free text, no auth/user module exists yet.' })
  @IsOptional()
  @IsString()
  requestedBy?: string;
}
