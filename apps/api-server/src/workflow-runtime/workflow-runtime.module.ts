import { Module } from '@nestjs/common';
import { AiOrchestratorModule } from '../ai/ai.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { GeminiModule } from '../gemini/gemini.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { InquiriesModule } from '../inquiries/inquiries.module';
import { N8nModule } from '../n8n/n8n.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { WorkflowRuntimeRepository } from './repositories/workflow-runtime.repository';
import { ConversationWorkflowService } from './services/conversation-workflow.service';
import { WorkflowDispatcherService } from './services/workflow-dispatcher.service';
import { WorkflowExecutionService } from './services/workflow-execution.service';
import { WorkflowRetryService } from './services/workflow-retry.service';
import { WorkflowRuntimeService } from './services/workflow-runtime.service';
import { WorkflowRuntimeController } from './workflow-runtime.controller';

/**
 * Sprint 21 - wires the already-built Conversation Engine (Sprint 16), AI
 * Orchestrator (Sprint 17-19), WhatsApp integration (Sprint 20), and n8n
 * (Sprint 15) into one automatic end-to-end flow. This module composes
 * those facades; it doesn't reimplement any of them - see each imported
 * module's own doc comment for what it exports and why. GeminiModule (Sprint
 * 24) is imported directly (not just via AiOrchestratorModule) purely for
 * the AI_PROVIDER token, the same
 * "depend on the interface, not the concrete provider" reasoning
 * ai.module.ts itself documents - used only for WorkflowRuntimeService's
 * health check, never to generate a reply (AiOrchestratorService.generate()
 * remains the only place that happens). PrismaModule isn't listed here
 * because it's @Global (see prisma.module.ts).
 *
 * Sprint 25 adds AppointmentsModule/DoctorsModule/InquiriesModule - the AI
 * receptionist's booking/reschedule/cancel decisions (WorkflowDispatcherService)
 * now call AppointmentsService/DoctorsService/InquiriesService directly,
 * reusing all of Sprint 13/2/25's existing validation rather than
 * reimplementing any of it.
 */
@Module({
  imports: [
    ConversationsModule,
    AiOrchestratorModule,
    GeminiModule,
    N8nModule,
    WhatsappModule,
    AppointmentsModule,
    DoctorsModule,
    InquiriesModule,
  ],
  controllers: [WorkflowRuntimeController],
  providers: [
    WorkflowRuntimeRepository,
    WorkflowExecutionService,
    WorkflowRetryService,
    WorkflowDispatcherService,
    ConversationWorkflowService,
    WorkflowRuntimeService,
  ],
})
export class WorkflowRuntimeModule {}
