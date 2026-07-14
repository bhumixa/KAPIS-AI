import { Module } from '@nestjs/common';
import { PatientsModule } from '../patients/patients.module';
import { InquiriesController } from './inquiries.controller';
import { InquiriesRepository } from './inquiries.repository';
import { InquiriesService } from './inquiries.service';

// Sprint 25 - deliberately only imports PatientsModule, not ConversationsModule:
// InquiriesService.convertToPatient() creates a Patient but leaves linking the
// conversation to its caller (WebhookService / WorkflowDispatcherService), both
// of which already depend on ConversationsModule directly. Avoids a circular
// module dependency, since ConversationsModule itself imports InquiriesModule
// (ConversationContextService needs InquiriesService for Inquiry-based
// conversations) - see inquiries.service.ts's doc comment for the full reasoning.
@Module({
  imports: [PatientsModule],
  controllers: [InquiriesController],
  providers: [InquiriesRepository, InquiriesService],
  exports: [InquiriesRepository, InquiriesService],
})
export class InquiriesModule {}
