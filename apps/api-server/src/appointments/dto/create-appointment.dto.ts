import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsISO8601, IsString, IsUUID, Matches, Min } from 'class-validator';

export type AppointmentType = 'consultation' | 'follow-up' | 'checkup' | 'procedure' | 'emergency';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

const APPOINTMENT_TYPES: AppointmentType[] = [
  'consultation',
  'follow-up',
  'checkup',
  'procedure',
  'emergency',
];
const STATUSES: AppointmentStatus[] = ['scheduled', 'completed', 'cancelled'];
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// apps/clinic-admin's AppointmentInput still submits durationMinutes/status (it's
// Omit<Appointment, 'id'|'createdAt'|'updatedAt'>, unchanged by this sprint) - both
// stay here so the global ValidationPipe's forbidNonWhitelisted doesn't reject the
// request, but AppointmentsService.create() ignores both: it snapshots
// durationMinutes from the doctor's current consultationDuration and always forces
// status to 'scheduled', which is the "Snapshot consultation duration" business
// rule moving server-side per Sprint 13's brief.
export class CreateAppointmentDto {
  @ApiProperty()
  @IsUUID()
  patientId!: string;

  @ApiProperty()
  @IsUUID()
  doctorId!: string;

  @ApiProperty()
  @IsISO8601({ strict: true })
  date!: string;

  @ApiProperty()
  @Matches(TIME_PATTERN)
  startTime!: string;

  @ApiProperty()
  @Matches(TIME_PATTERN)
  endTime!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @ApiProperty({ enum: APPOINTMENT_TYPES })
  @IsIn(APPOINTMENT_TYPES)
  type!: AppointmentType;

  @ApiProperty({ enum: STATUSES })
  @IsIn(STATUSES)
  status!: AppointmentStatus;

  @ApiProperty()
  @IsString()
  notes!: string;
}
