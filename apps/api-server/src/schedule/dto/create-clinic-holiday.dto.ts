import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsISO8601, IsString, MinLength } from 'class-validator';

// Mirrors HolidayForm's validators (name/date required, recurringYearly optional boolean).
export class CreateClinicHolidayDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty()
  @IsISO8601({ strict: true })
  date!: string;

  @ApiProperty()
  @IsBoolean()
  recurringYearly!: boolean;
}
