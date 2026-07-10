import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, Matches } from 'class-validator';

export type DayOfWeek =
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// Monday-first, matching apps/clinic-admin's DAYS_OF_WEEK ordering.
export const DAYS_OF_WEEK: readonly DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class DayScheduleDto {
  @ApiProperty({ enum: DAYS_OF_WEEK })
  @IsIn(DAYS_OF_WEEK)
  day!: DayOfWeek;

  @ApiProperty()
  @IsBoolean()
  isWorking!: boolean;

  @ApiProperty()
  @Matches(TIME_PATTERN)
  morningStart!: string;

  @ApiProperty()
  @Matches(TIME_PATTERN)
  morningEnd!: string;

  @ApiProperty()
  @Matches(TIME_PATTERN)
  afternoonStart!: string;

  @ApiProperty()
  @Matches(TIME_PATTERN)
  afternoonEnd!: string;
}
