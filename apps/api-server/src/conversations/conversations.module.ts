import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { InquiriesModule } from '../inquiries/inquiries.module';
import { PatientsModule } from '../patients/patients.module';
import { ConversationContextService } from './conversation-context.service';
import { ConversationHistoryService } from './conversation-history.service';
import { ConversationService } from './conversation.service';
import { ConversationsController } from './conversations.controller';
import { ConversationsRepository } from './conversations.repository';
import { MessageService } from './message.service';

// The Conversation Engine (Sprint 16) - prepares all context an eventual AI
// reply-drafting feature needs (ConversationContextService) and the paginated/
// chronological message history it will read from (ConversationHistoryService),
// but calls neither the AI provider nor WhatsApp - see each service's doc comment.
// Imports DoctorsModule/PatientsModule/AppointmentsModule purely for their
// Sprint 16-added service exports (ConversationContextService composes them
// instead of duplicating patient/doctor/appointment lookups) - no new coupling
// beyond what AppointmentsModule already established for the same modules.
// ConversationService/MessageService/ConversationContextService are exported
// (Sprint 17) so AIOrchestratorModule's ConversationContextBuilderService can
// reuse them for notes/messages/context instead of duplicating any of this
// module's Prisma queries - the same reuse pattern this module's own imports
// already established one layer down.
@Module({
  // Sprint 25 - InquiriesModule added so ConversationContextService can
  // resolve the `inquiry` side of Inquiry-based conversations (no matching
  // patientId yet). InquiriesModule only imports PatientsModule, not this
  // module, so this stays a one-directional dependency - see
  // inquiries.module.ts's doc comment.
  imports: [PatientsModule, DoctorsModule, AppointmentsModule, InquiriesModule],
  controllers: [ConversationsController],
  providers: [
    ConversationsRepository,
    ConversationService,
    MessageService,
    ConversationHistoryService,
    ConversationContextService,
  ],
  exports: [ConversationService, MessageService, ConversationContextService],
})
export class ConversationsModule {}
