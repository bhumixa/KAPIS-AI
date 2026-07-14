import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';

export type PatientGender = 'male' | 'female' | 'other';
export type PatientStatus = 'active' | 'inactive';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';
export type PatientProfileSource = 'manual' | 'whatsapp_inquiry';

const GENDERS: PatientGender[] = ['male', 'female', 'other'];
const STATUSES: PatientStatus[] = ['active', 'inactive'];
const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'];
const PROFILE_SOURCES: PatientProfileSource[] = ['manual', 'whatsapp_inquiry'];
const PHONE_PATTERN = /^[0-9+\-\s]{7,15}$/;

export class EmergencyContactDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  relationship!: string;

  @ApiProperty()
  @Matches(PHONE_PATTERN)
  phone!: string;
}

// Mirrors the validators on apps/clinic-admin's PatientForm (Validators.required/
// pattern/email, notFutureDateValidator) so client and server reject the same inputs.
export class CreatePatientDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiProperty({ enum: GENDERS })
  @IsIn(GENDERS)
  gender!: PatientGender;

  @ApiProperty()
  @IsISO8601({ strict: true })
  dateOfBirth!: string;

  @ApiProperty()
  @Matches(PHONE_PATTERN)
  mobileNumber!: string;

  @ApiProperty()
  @Matches(PHONE_PATTERN)
  whatsappNumber!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: BLOOD_GROUPS })
  @IsIn(BLOOD_GROUPS)
  bloodGroup!: BloodGroup;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  address!: string;

  @ApiProperty({ type: EmergencyContactDto })
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact!: EmergencyContactDto;

  @ApiProperty()
  @IsString()
  allergies!: string;

  @ApiProperty()
  @IsString()
  medicalNotes!: string;

  @ApiProperty({ enum: STATUSES })
  @IsIn(STATUSES)
  status!: PatientStatus;

  // Sprint 25 - 'whatsapp_inquiry' when InquiriesService.convertToPatient()
  // auto-creates this record from a WhatsApp booking; omitted (defaults to
  // 'manual') for every existing caller (clinic-admin's Patient form etc.).
  @ApiPropertyOptional({ enum: PROFILE_SOURCES })
  @IsOptional()
  @IsIn(PROFILE_SOURCES)
  profileSource?: PatientProfileSource;
}
