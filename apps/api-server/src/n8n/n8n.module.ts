import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { WorkflowExecutionsRepository } from './executions/workflow-executions.repository';
import { WorkflowImportService } from './import/workflow-import.service';
import { N8nController } from './n8n.controller';
import { N8nService } from './n8n.service';
import { WorkflowRegistryService } from './registry/workflow-registry.service';

@Module({
  // No global default timeout here - N8nService/WorkflowImportService each pass
  // `timeout: n8nConfig.httpTimeoutMs` (N8N_HTTP_TIMEOUT_MS) per request instead,
  // so the one configurable value lives in configuration.ts, not duplicated here.
  imports: [HttpModule],
  controllers: [N8nController],
  providers: [N8nService, WorkflowRegistryService, WorkflowExecutionsRepository, WorkflowImportService],
  // Sprint 21 (workflow-runtime) injects N8nService to trigger the real n8n
  // webhook from the end-to-end conversation pipeline - same "export the
  // facade service only" pattern every other module here already follows
  // (ConversationsModule, AiOrchestratorModule, RagModule).
  exports: [N8nService],
})
export class N8nModule {}
