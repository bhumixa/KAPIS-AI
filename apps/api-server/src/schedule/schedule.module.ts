import { Module } from '@nestjs/common';
import { DoctorsModule } from '../doctors/doctors.module';
import { ClinicHolidayController } from './clinic-holiday.controller';
import { ClinicHolidayRepository } from './clinic-holiday.repository';
import { DoctorLeaveController } from './doctor-leave.controller';
import { DoctorLeaveRepository } from './doctor-leave.repository';
import { DoctorScheduleRepository } from './doctor-schedule.repository';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [DoctorsModule],
  controllers: [ScheduleController, DoctorLeaveController, ClinicHolidayController],
  providers: [
    ScheduleService,
    DoctorScheduleRepository,
    DoctorLeaveRepository,
    ClinicHolidayRepository,
  ],
  exports: [ScheduleService],
})
export class ScheduleModule {}
