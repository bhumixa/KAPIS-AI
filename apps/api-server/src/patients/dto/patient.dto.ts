import { ApiProperty } from '@nestjs/swagger';
import {
  BloodGroup,
  EmergencyContactDto,
  PatientGender,
  PatientStatus,
} from './create-patient.dto';

export class PatientDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ enum: ['male', 'female', 'other'] })
  gender!: PatientGender;

  @ApiProperty()
  dateOfBirth!: string;

  @ApiProperty()
  mobileNumber!: string;

  @ApiProperty()
  whatsappNumber!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  bloodGroup!: BloodGroup;

  @ApiProperty()
  address!: string;

  @ApiProperty({ type: EmergencyContactDto })
  emergencyContact!: EmergencyContactDto;

  @ApiProperty()
  allergies!: string;

  @ApiProperty()
  medicalNotes!: string;

  @ApiProperty({ enum: ['active', 'inactive'] })
  status!: PatientStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
