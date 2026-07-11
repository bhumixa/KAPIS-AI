import { ChartGranularity } from '../dto/analytics-query.dto';
import { ChartPointDto } from '../dto/chart-series.dto';

/**
 * Buckets a list of timestamps into a sorted ChartPointDto[] for the given
 * granularity - shared by every /api/analytics/reports/* and
 * /api/analytics/charts/* endpoint that returns a ChartSeriesDto. Pure/
 * synchronous: AnalyticsRepository fetches the raw rows (already filtered by
 * whatever AnalyticsQueryDto the caller supplied), this only groups them -
 * same "repository fetches, a plain function/service shapes" split
 * AppointmentsService's own mappers use.
 */
export function bucketIntoChartSeries(
  dates: Date[],
  granularity: ChartGranularity,
): ChartPointDto[] {
  const counts = new Map<string, number>();
  for (const date of dates) {
    const label = bucketLabel(date, granularity);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value }));
}

function bucketLabel(date: Date, granularity: ChartGranularity): string {
  switch (granularity) {
    case 'daily':
      return date.toISOString().slice(0, 10);
    case 'weekly':
      return startOfIsoWeek(date).toISOString().slice(0, 10);
    case 'monthly':
      return date.toISOString().slice(0, 7);
    case 'yearly':
      return String(date.getUTCFullYear());
  }
}

function startOfIsoWeek(date: Date): Date {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  utcDate.setUTCDate(utcDate.getUTCDate() + diffToMonday);
  return utcDate;
}
