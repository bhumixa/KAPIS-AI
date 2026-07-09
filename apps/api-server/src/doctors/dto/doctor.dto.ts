import { ApiProperty } from '@nestjs/swagger';
import { DoctorGender, DoctorStatus } from './create-doctor.dto';

export class DoctorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ enum: ['male', 'female', 'other'] })
  gender!: DoctorGender;

  @ApiProperty()
  specialization!: string;

  @ApiProperty()
  qualification!: string;

  @ApiProperty()
  experienceYears!: number;

  @ApiProperty()
  registrationNumber!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  consultationFee!: number;

  @ApiProperty()
  consultationDuration!: number;

  @ApiProperty({ enum: ['active', 'inactive'] })
  status!: DoctorStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
