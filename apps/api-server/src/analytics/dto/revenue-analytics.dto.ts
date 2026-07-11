import { ApiProperty } from '@nestjs/swagger';
import { ChartSeriesDto } from './chart-series.dto';

export class DoctorRevenueDto {
  @ApiProperty()
  doctorId!: string;

  @ApiProperty()
  doctorName!: string;

  @ApiProperty()
  revenue!: number;

  @ApiProperty()
  completedAppointmentCount!: number;
}

/**
 * GET /api/analytics/reports/revenue response. There is no billing/invoicing
 * module anywhere in Sprint 1-22 - revenue is derived, read-only, from
 * `completed` appointments joined to their doctor's `consultationFee`
 * (Doctor.consultationFee), the only price the schema tracks anywhere. This
 * is an estimate (an appointment's actual billed amount, if it ever differs
 * from the doctor's list fee, isn't recorded), not a reimplementation of any
 * business rule owned elsewhere.
 */
export class RevenueAnalyticsDto {
  @ApiProperty()
  totalRevenue!: number;

  @ApiProperty({ type: [DoctorRevenueDto] })
  revenueByDoctor!: DoctorRevenueDto[];

  @ApiProperty()
  chart!: ChartSeriesDto;
}
