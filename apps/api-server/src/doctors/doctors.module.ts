import { Module } from '@nestjs/common';
import { DoctorsController } from './doctors.controller';
import { DoctorsRepository } from './doctors.repository';
import { DoctorsService } from './doctors.service';

@Module({
  controllers: [DoctorsController],
  providers: [DoctorsService, DoctorsRepository],
  // DoctorsService export added in Sprint 16 so ConversationsModule can reuse
  // its DTO mapping instead of duplicating toDoctorDto() - same reuse pattern
  // this module already offered AppointmentsModule via DoctorsRepository.
  exports: [DoctorsRepository, DoctorsService],
})
export class DoctorsModule {}
