import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { DoctorsModule } from '../doctors/doctors.module';
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
// but calls neither Claude nor WhatsApp - see each service's doc comment.
// Imports DoctorsModule/PatientsModule/AppointmentsModule purely for their
// Sprint 16-added service exports (ConversationContextService composes them
// instead of duplicating patient/doctor/appointment lookups) - no new coupling
// beyond what AppointmentsModule already established for the same modules.
@Module({
  imports: [PatientsModule, DoctorsModule, AppointmentsModule],
  controllers: [ConversationsController],
  providers: [
    ConversationsRepository,
    ConversationService,
    MessageService,
    ConversationHistoryService,
    ConversationContextService,
  ],
})
export class ConversationsModule {}
