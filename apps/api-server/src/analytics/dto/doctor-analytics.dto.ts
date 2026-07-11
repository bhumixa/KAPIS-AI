import { ApiProperty } from '@nestjs/swagger';

export class DoctorAppointmentCountDto {
  @ApiProperty()
  doctorId!: string;

  @ApiProperty()
  doctorName!: string;

  @ApiProperty()
  appointmentCount!: number;
}

/** GET /api/analytics/reports/doctors response - the Sprint 23 "Doctors" report. */
export class DoctorAnalyticsDto {
  @ApiProperty()
  totalDoctors!: number;

  @ApiProperty()
  activeDoctors!: number;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, description: 'Count by Doctor.specialization - also serves as the "Department" breakdown.' })
  bySpecialization!: Record<string, number>;

  @ApiProperty({ type: [DoctorAppointmentCountDto] })
  appointmentsByDoctor!: DoctorAppointmentCountDto[];
}
