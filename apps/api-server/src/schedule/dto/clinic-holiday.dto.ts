import { ApiProperty } from '@nestjs/swagger';

export class ClinicHolidayDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  date!: string;

  @ApiProperty()
  recurringYearly!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
