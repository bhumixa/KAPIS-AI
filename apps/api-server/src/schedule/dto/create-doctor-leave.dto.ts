import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsString, IsUUID, MinLength } from 'class-validator';

export type LeaveType = 'vacation' | 'sick' | 'emergency' | 'conference' | 'other';

const LEAVE_TYPES: LeaveType[] = ['vacation', 'sick', 'emergency', 'conference', 'other'];

// Mirrors LeaveForm's validators (all required, dateRangeValidator checked in
// DoctorLeaveService since it needs both fields at once).
export class CreateDoctorLeaveDto {
  @ApiProperty()
  @IsUUID()
  doctorId!: string;

  @ApiProperty({ enum: LEAVE_TYPES })
  @IsIn(LEAVE_TYPES)
  type!: LeaveType;

  @ApiProperty()
  @IsISO8601({ strict: true })
  startDate!: string;

  @ApiProperty()
  @IsISO8601({ strict: true })
  endDate!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  reason!: string;
}
