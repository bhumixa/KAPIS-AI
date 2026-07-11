import { Prisma } from '@prisma/client';
import { isoDateToDate } from '../../common/utils/date-time.util';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';

/** Shared by ReportService and ExportService so a `dateFrom`/`dateTo` filter always turns into the same Prisma.DateTimeFilter shape. */
export function dateRangeFilter(query: AnalyticsQueryDto): Prisma.DateTimeFilter | undefined {
  if (!query.dateFrom && !query.dateTo) {
    return undefined;
  }
  return {
    ...(query.dateFrom ? { gte: isoDateToDate(query.dateFrom) } : {}),
    ...(query.dateTo ? { lte: isoDateToDate(query.dateTo) } : {}),
  };
}
