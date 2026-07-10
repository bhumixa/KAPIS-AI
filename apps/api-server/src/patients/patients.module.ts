import { Module } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsRepository } from './patients.repository';
import { PatientsService } from './patients.service';

@Module({
  controllers: [PatientsController],
  providers: [PatientsService, PatientsRepository],
  // PatientsService export added in Sprint 16 so ConversationsModule can reuse
  // its DTO mapping instead of duplicating toPatientDto() - same reuse pattern
  // this module already offered AppointmentsModule via PatientsRepository.
  exports: [PatientsRepository, PatientsService],
})
export class PatientsModule {}
