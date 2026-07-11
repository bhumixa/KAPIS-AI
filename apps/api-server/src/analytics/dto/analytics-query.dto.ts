import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';

export type ChartGranularity = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const CHART_GRANULARITIES: ChartGranularity[] = ['daily', 'weekly', 'monthly', 'yearly'];

/**
 * Shared filter set every /api/analytics/reports/* and /api/analytics/charts/*
 * endpoint accepts (the Sprint 23 brief's "Filters" section: Date Range,
 * Doctor, Patient, Status, Department). Every field is optional - an absent
 * filter means "no restriction", not "zero results" - and every consumer
 * (AnalyticsRepository) applies only the filters it received, the same
 * "spread only what's present" shape ConversationService.findAll()/
 * AppointmentsService already use for their own where-clauses. `department`
 * has no dedicated column anywhere in the schema - it maps onto
 * `Doctor.specialization`, the closest existing concept (see
 * AnalyticsRepository's doc comment).
 */
export class AnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Inclusive ISO-8601 start date, e.g. 2026-06-01.' })
  @IsOptional()
  @IsISO8601({ strict: true })
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Inclusive ISO-8601 end date, e.g. 2026-06-30.' })
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

  @ApiPropertyOptional({ description: 'Report-specific status value (appointment/conversation/workflow status, etc.).' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Maps onto Doctor.specialization - there is no dedicated department column in the schema.' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ enum: CHART_GRANULARITIES, default: 'daily' })
  @IsOptional()
  @IsIn(CHART_GRANULARITIES)
  granularity?: ChartGranularity = 'daily';
}
