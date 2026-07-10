import { Module } from '@nestjs/common';
import { DoctorsModule } from '../doctors/doctors.module';
import { PatientsModule } from '../patients/patients.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsRepository } from './appointments.repository';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [DoctorsModule, PatientsModule, ScheduleModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository],
  // Exported in Sprint 16 so ConversationsModule can read a patient's
  // upcoming/previous appointments for ConversationContextService without
  // duplicating AppointmentsRepository/AppointmentsService.
  exports: [AppointmentsRepository, AppointmentsService],
})
export class AppointmentsModule {}
