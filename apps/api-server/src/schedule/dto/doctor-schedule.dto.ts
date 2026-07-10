import { ApiProperty } from '@nestjs/swagger';
import { DayScheduleDto } from './day-schedule.dto';

export class DoctorScheduleDto {
  @ApiProperty()
  doctorId!: string;

  @ApiProperty({ type: [DayScheduleDto] })
  days!: DayScheduleDto[];

  @ApiProperty()
  updatedAt!: string;
}
