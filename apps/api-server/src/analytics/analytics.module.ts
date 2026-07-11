import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { AnalyticsService } from './services/analytics.service';
import { DashboardAnalyticsService } from './services/dashboard-analytics.service';
import { ExportService } from './services/export.service';
import { ReportService } from './services/report.service';

/**
 * Sprint 23 - Analytics & Reporting, the final MVP sprint. Deliberately
 * imports no other feature module: PrismaService is @Global() (see
 * prisma.module.ts), so AnalyticsRepository reaches every table it needs to
 * read directly through it, the same "no explicit import needed" shape
 * HealthController already uses for its own PrismaService dependency. This
 * keeps the module purely additive - nothing in Sprint 1-22 is touched, no
 * existing module's `exports` array needs to grow to satisfy this one. The
 * two places this module does reuse other modules' code (toAppointmentDto/
 * toDoctorDto/toPatientDto in ExportService) are plain function imports, not
 * Nest providers, so they don't require importing AppointmentsModule/
 * DoctorsModule/PatientsModule either - see ExportService's own doc comment.
 */
@Module({
  controllers: [AnalyticsController],
  providers: [
    AnalyticsRepository,
    DashboardAnalyticsService,
    ReportService,
    ExportService,
    AnalyticsService,
  ],
})
export class AnalyticsModule {}
