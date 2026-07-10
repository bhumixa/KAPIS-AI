import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, ValidateNested } from 'class-validator';
import { DayScheduleDto } from './day-schedule.dto';

// WeeklyScheduleEditor always submits all 7 days in DAYS_OF_WEEK order (see
// apps/clinic-admin's weekly-schedule-editor.ts) - ScheduleService validates that
// every day is present exactly once before persisting.
export class UpdateDoctorScheduleDto {
  @ApiProperty({ type: [DayScheduleDto] })
  @ValidateNested({ each: true })
  @ArrayMinSize(7)
  @Type(() => DayScheduleDto)
  days!: DayScheduleDto[];
}
