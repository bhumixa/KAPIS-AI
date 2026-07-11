import { Global, Module } from '@nestjs/common';
import { WorkflowEventsService } from './workflow-events.service';

/** @Global so WebhookService (whatsapp) and ConversationWorkflowService (workflow-runtime) can both inject WorkflowEventsService without a direct module dependency on each other. */
@Global()
@Module({
  providers: [WorkflowEventsService],
  exports: [WorkflowEventsService],
})
export class WorkflowEventsModule {}
