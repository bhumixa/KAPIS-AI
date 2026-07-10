import { Module } from '@nestjs/common';
import { N8nController } from './n8n.controller';
import { N8nService } from './n8n.service';
import { WorkflowRegistryService } from './registry/workflow-registry.service';

@Module({
  controllers: [N8nController],
  providers: [N8nService, WorkflowRegistryService],
})
export class N8nModule {}
