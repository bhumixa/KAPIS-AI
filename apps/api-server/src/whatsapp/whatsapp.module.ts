import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { PatientsModule } from '../patients/patients.module';
import { MediaService } from './media.service';
import { PhoneNumberService } from './phone-number.service';
import { WebhookService } from './webhook.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappHttpService } from './whatsapp-http.service';
import { WhatsappRepository } from './whatsapp.repository';
import { WhatsappService } from './whatsapp.service';

/**
 * Sprint 20 - the real WhatsApp Cloud API communication layer. Deliberately
 * stops at communication: no AI provider is called, no n8n workflow is
 * triggered, no reply is ever generated automatically (see each service's
 * own doc comment) - that stays exactly the boundary AiOrchestratorModule/
 * N8nModule own, this module never imports either. Imports ConversationsModule
 * (Sprint 16) and PatientsModule (Sprint 4) purely for their exported
 * ConversationService/MessageService/PatientsService - WebhookService/
 * WhatsappService compose them instead of duplicating conversation-timeline
 * or patient-lookup logic, the same reuse pattern ConversationsModule itself
 * established one layer down for Doctors/Patients/Appointments. HttpModule
 * backs WhatsappHttpService, the one place that makes an HTTPS call to Meta's
 * Graph API - mirrors ClaudeModule/N8nModule's own HttpModule usage.
 *
 * Sprint 21 (workflow-runtime) needs to send AI-drafted replies out and read
 * connection health, so WhatsappService/PhoneNumberService are exported the
 * same facade-only way ConversationsModule exports ConversationService/
 * MessageService - this module still never imports workflow-runtime or
 * calls into it; workflow-runtime always calls in, never the other way.
 */
@Module({
  imports: [HttpModule, ConversationsModule, PatientsModule],
  controllers: [WhatsappController],
  providers: [
    WhatsappRepository,
    WhatsappHttpService,
    PhoneNumberService,
    MediaService,
    WebhookService,
    WhatsappService,
  ],
  exports: [WhatsappService, PhoneNumberService],
})
export class WhatsappModule {}
