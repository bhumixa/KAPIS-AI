import { ApiProperty } from '@nestjs/swagger';
import { ExportFormat, ReportType } from './export-report.dto';

/** One row of clinic.report_exports - returned by POST /api/analytics/export and GET /api/analytics/exports. */
export class ReportExportDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  reportType!: ReportType;

  @ApiProperty()
  format!: ExportFormat;

  @ApiProperty({ type: 'object', additionalProperties: true })
  filters!: Record<string, unknown>;

  @ApiProperty({ enum: ['completed', 'failed'] })
  status!: 'completed' | 'failed';

  @ApiProperty()
  fileName!: string;

  @ApiProperty()
  rowCount!: number;

  @ApiProperty()
  requestedBy!: string;

  @ApiProperty({ nullable: true })
  errorMessage!: string | null;

  @ApiProperty()
  createdAt!: string;
}
