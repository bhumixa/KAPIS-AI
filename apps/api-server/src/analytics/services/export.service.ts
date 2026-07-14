import { Injectable } from '@nestjs/common';
import { Prisma, ReportExport } from '@prisma/client';
import { toAppointmentDto } from '../../appointments/appointments.service';
import { toDoctorDto } from '../../doctors/doctors.service';
import { toPatientDto } from '../../patients/patients.service';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';
import { ExportFormat, ExportReportDto, ReportType } from '../dto/export-report.dto';
import { ReportExportDto } from '../dto/report-export.dto';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { dateRangeFilter } from '../utils/date-range.util';
import { toCsv, toExcelHtml } from '../utils/export-format.util';
import { buildSimplePdf } from '../utils/pdf.util';

export interface ExportResult {
  fileName: string;
  contentType: string;
  buffer: Buffer;
  record: ReportExportDto;
}

interface ReportTable {
  columns: string[];
  rows: (string | number)[][];
}

/**
 * The Sprint 23 "Export" section (CSV/Excel/PDF) applied to any of the nine
 * report types. Row-level data for appointments/doctors/patients is built
 * with toAppointmentDto()/toDoctorDto()/toPatientDto() - the same exported
 * plain-function mappers AppointmentsService/DoctorsService/PatientsService
 * already offer other modules (see doctors.module.ts's doc comment on why
 * DoctorsService is exported) - so this module never re-derives their DTO
 * shape. Every export is recorded to clinic.report_exports (this module's
 * own table) whether it succeeds or fails, for the Exports page's history table.
 */
@Injectable()
export class ExportService {
  constructor(private readonly repository: AnalyticsRepository) {}

  async export(dto: ExportReportDto): Promise<ExportResult> {
    const query = this.toQuery(dto);

    try {
      const table = await this.buildTable(dto.reportType, query);
      const fileName = `${dto.reportType}-${Date.now()}.${this.extensionFor(dto.format)}`;
      const buffer = this.render(dto.format, dto.reportType, table);

      const saved = await this.repository.createReportExport({
        reportType: dto.reportType,
        format: dto.format,
        filters: query as unknown as Prisma.InputJsonValue,
        status: 'completed',
        fileName,
        rowCount: table.rows.length,
        requestedBy: dto.requestedBy ?? '',
      });

      return { fileName, contentType: this.contentTypeFor(dto.format), buffer, record: toReportExportDto(saved) };
    } catch (error) {
      await this.repository.createReportExport({
        reportType: dto.reportType,
        format: dto.format,
        filters: query as unknown as Prisma.InputJsonValue,
        status: 'failed',
        fileName: '',
        rowCount: 0,
        requestedBy: dto.requestedBy ?? '',
        errorMessage: error instanceof Error ? error.message : 'Unknown export error',
      });
      throw error;
    }
  }

  async listRecent(limit = 50): Promise<ReportExportDto[]> {
    const records = await this.repository.findRecentReportExports(limit);
    return records.map(toReportExportDto);
  }

  private toQuery(dto: ExportReportDto): AnalyticsQueryDto {
    return {
      dateFrom: dto.dateFrom,
      dateTo: dto.dateTo,
      doctorId: dto.doctorId,
      patientId: dto.patientId,
      status: dto.status,
      department: dto.department,
    };
  }

  private async buildTable(reportType: ReportType, query: AnalyticsQueryDto): Promise<ReportTable> {
    const dateRange = dateRangeFilter(query);

    switch (reportType) {
      case 'appointments': {
        const appointments = await this.repository.findAppointments({
          ...(query.doctorId ? { doctorId: query.doctorId } : {}),
          ...(query.patientId ? { patientId: query.patientId } : {}),
          ...(query.status ? { status: query.status } : {}),
          ...(dateRange ? { appointmentDate: dateRange } : {}),
        });
        const rows = appointments.map(toAppointmentDto);
        return {
          columns: ['id', 'patientId', 'doctorId', 'date', 'startTime', 'endTime', 'type', 'status'],
          rows: rows.map((r) => [r.id, r.patientId, r.doctorId, r.date, r.startTime, r.endTime, r.type, r.status]),
        };
      }
      case 'doctors': {
        const doctors = await this.repository.findDoctors({
          ...(query.doctorId ? { id: query.doctorId } : {}),
          ...(query.department ? { specialization: query.department } : {}),
          ...(query.status ? { status: query.status } : {}),
        });
        const rows = doctors.map(toDoctorDto);
        return {
          columns: ['id', 'firstName', 'lastName', 'specialization', 'email', 'phone', 'status'],
          rows: rows.map((r) => [r.id, r.firstName, r.lastName, r.specialization, r.email, r.phone, r.status]),
        };
      }
      case 'patients': {
        const patients = await this.repository.findPatients({
          ...(query.patientId ? { id: query.patientId } : {}),
          ...(query.status ? { status: query.status } : {}),
          ...(dateRange ? { createdAt: dateRange } : {}),
        });
        const rows = patients.map(toPatientDto);
        return {
          columns: ['id', 'firstName', 'lastName', 'gender', 'mobileNumber', 'status'],
          rows: rows.map((r) => [r.id, r.firstName, r.lastName, r.gender, r.mobileNumber, r.status]),
        };
      }
      case 'conversations': {
        const conversations = await this.repository.findConversations({
          ...(query.patientId ? { patientId: query.patientId } : {}),
          ...(query.status ? { status: query.status } : {}),
          ...(dateRange ? { createdAt: dateRange } : {}),
        });
        return {
          columns: ['id', 'patientId', 'channel', 'status', 'createdAt'],
          rows: conversations.map((c) => [c.id, c.patientId ?? '', c.channel, c.status, c.createdAt.toISOString()]),
        };
      }
      case 'automation': {
        const executions = await this.repository.findWorkflowRuntimeExecutions({
          ...(query.status ? { status: query.status } : {}),
          ...(dateRange ? { startedAt: dateRange } : {}),
        });
        return {
          columns: ['id', 'conversationId', 'triggerSource', 'decision', 'status', 'durationMs', 'startedAt'],
          rows: executions.map((e) => [
            e.id,
            e.conversationId ?? '',
            e.triggerSource,
            e.decision ?? '',
            e.status,
            e.durationMs ?? '',
            e.startedAt.toISOString(),
          ]),
        };
      }
      case 'ai': {
        const executions = await this.repository.findAiExecutions({
          ...(query.status ? { status: query.status } : {}),
          ...(dateRange ? { createdAt: dateRange } : {}),
        });
        return {
          columns: ['id', 'conversationId', 'provider', 'model', 'totalTokens', 'latencyMs', 'status', 'createdAt'],
          rows: executions.map((e) => [
            e.id,
            e.conversationId,
            e.provider,
            e.model,
            e.totalTokens,
            e.latencyMs,
            e.status,
            e.createdAt.toISOString(),
          ]),
        };
      }
      case 'whatsapp': {
        const messages = await this.repository.findWhatsappMessages({
          ...(query.status ? { status: query.status } : {}),
          ...(dateRange ? { createdAt: dateRange } : {}),
        });
        return {
          columns: ['id', 'direction', 'messageType', 'fromNumber', 'toNumber', 'status', 'createdAt'],
          rows: messages.map((m) => [
            m.id,
            m.direction,
            m.messageType,
            m.fromNumber,
            m.toNumber,
            m.status,
            m.createdAt.toISOString(),
          ]),
        };
      }
      case 'google-calendar': {
        const events = await this.repository.findGoogleCalendarSyncEvents({
          ...(query.status ? { status: query.status } : {}),
          ...(dateRange ? { syncedAt: dateRange } : {}),
        });
        return {
          columns: ['id', 'appointmentId', 'googleEventId', 'operation', 'status', 'syncedAt'],
          rows: events.map((e) => [
            e.id,
            e.appointmentId ?? '',
            e.googleEventId ?? '',
            e.operation,
            e.status,
            e.syncedAt.toISOString(),
          ]),
        };
      }
      case 'knowledge-base': {
        const counts = await this.repository.countKnowledgeBaseItems();
        return {
          columns: ['source', 'itemCount'],
          rows: Object.entries(counts).map(([source, count]) => [source, count]),
        };
      }
    }
  }

  private render(format: ExportFormat, reportType: ReportType, table: ReportTable): Buffer {
    const title = `${reportType} report`;
    switch (format) {
      case 'csv':
        return toCsv(table.columns, table.rows);
      case 'excel':
        return toExcelHtml(title, table.columns, table.rows);
      case 'pdf':
        return buildSimplePdf(title, [
          table.columns.join(' | '),
          ...table.rows.map((row) => row.map(String).join(' | ')),
        ]);
    }
  }

  private extensionFor(format: ExportFormat): string {
    return format === 'excel' ? 'xls' : format;
  }

  private contentTypeFor(format: ExportFormat): string {
    switch (format) {
      case 'csv':
        return 'text/csv';
      case 'excel':
        return 'application/vnd.ms-excel';
      case 'pdf':
        return 'application/pdf';
    }
  }
}

function toReportExportDto(record: ReportExport): ReportExportDto {
  return {
    id: record.id,
    reportType: record.reportType as ReportType,
    format: record.format as ExportFormat,
    filters: record.filters as Record<string, unknown>,
    status: record.status as 'completed' | 'failed',
    fileName: record.fileName,
    rowCount: record.rowCount,
    requestedBy: record.requestedBy,
    errorMessage: record.errorMessage,
    createdAt: record.createdAt.toISOString(),
  };
}
