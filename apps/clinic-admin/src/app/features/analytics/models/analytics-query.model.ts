/** Mirrors apps/api-server's AnalyticsQueryDto - the shared filter set every report/chart endpoint accepts. */
export type ChartGranularity = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const CHART_GRANULARITIES: ChartGranularity[] = ['daily', 'weekly', 'monthly', 'yearly'];

export interface AnalyticsQuery {
  dateFrom?: string;
  dateTo?: string;
  doctorId?: string;
  patientId?: string;
  status?: string;
  department?: string;
  granularity?: ChartGranularity;
}
