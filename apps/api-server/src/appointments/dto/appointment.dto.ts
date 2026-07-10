import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus, AppointmentType } from './create-appointment.dto';

export class AppointmentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  patientId!: string;

  @ApiProperty()
  doctorId!: string;

  @ApiProperty()
  date!: string;

  @ApiProperty()
  startTime!: string;

  @ApiProperty()
  endTime!: string;

  @ApiProperty()
  durationMinutes!: number;

  @ApiProperty({ enum: ['consultation', 'follow-up', 'checkup', 'procedure', 'emergency'] })
  type!: AppointmentType;

  @ApiProperty({ enum: ['scheduled', 'completed', 'cancelled'] })
  status!: AppointmentStatus;

  @ApiProperty()
  notes!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
