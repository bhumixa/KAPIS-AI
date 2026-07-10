import { ApiProperty } from '@nestjs/swagger';
import { LeaveType } from './create-doctor-leave.dto';

export class DoctorLeaveDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  doctorId!: string;

  @ApiProperty({ enum: ['vacation', 'sick', 'emergency', 'conference', 'other'] })
  type!: LeaveType;

  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;

  @ApiProperty()
  reason!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
