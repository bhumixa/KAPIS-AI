import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsInt, IsNumber, IsString, Matches, Min, MinLength } from 'class-validator';

export type DoctorGender = 'male' | 'female' | 'other';
export type DoctorStatus = 'active' | 'inactive';

const GENDERS: DoctorGender[] = ['male', 'female', 'other'];
const STATUSES: DoctorStatus[] = ['active', 'inactive'];

// Mirrors the validators on apps/clinic-admin's DoctorForm (Validators.required/
// min/pattern/email) so client and server reject the same inputs.
export class CreateDoctorDto {
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
  gender!: DoctorGender;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  specialization!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  qualification!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  experienceYears!: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  registrationNumber!: string;

  @ApiProperty()
  @Matches(/^[0-9+\-\s]{7,15}$/)
  phone!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  consultationFee!: number;

  @ApiProperty()
  @IsInt()
  @Min(10)
  consultationDuration!: number;

  @ApiProperty({ enum: STATUSES })
  @IsIn(STATUSES)
  status!: DoctorStatus;
}
