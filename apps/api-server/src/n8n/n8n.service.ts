import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { AppConfig } from '../config/configuration';
import { N8nHealthDto } from './dto/n8n-health.dto';
import { TriggerWorkflowDto } from './dto/trigger-workflow.dto';
import { WorkflowExecutionDto } from './dto/workflow-execution.dto';
import { WorkflowDefinition } from './models/workflow-definition.model';
import { WorkflowEvent } from './models/workflow-event.model';
import { WorkflowExecutionRequest } from './models/workflow-execution-request.model';
import { WorkflowRegistryService } from './registry/workflow-registry.service';

// Bounds the in-memory execution log so a long-running dev server doesn't grow
// this array unboundedly - there's no persistence for executions this sprint
// (no WorkflowExecution table/migration exists), only a recent-history view for
// the Automation dashboard to poll.
const MAX_RECENT_EXECUTIONS = 50;

@Injectable()
export class N8nService {
  private readonly n8nConfig: AppConfig['n8n'];
  private readonly recentExecutions: WorkflowExecutionDto[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly workflowRegistry: WorkflowRegistryService,
  ) {
    this.n8nConfig = this.configService.get<AppConfig['n8n']>('app.n8n')!;
  }

  checkHealth(): N8nHealthDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      configured: this.n8nConfig.baseUrl.length > 0,
      baseUrl: this.n8nConfig.baseUrl,
      registeredWorkflowCount: this.workflowRegistry.findAll().length,
    };
  }

  listWorkflows(): WorkflowDefinition[] {
    return this.workflowRegistry.findAll();
  }

  getWorkflow(id: string): WorkflowDefinition {
    return this.workflowRegistry.findById(id);
  }

  getRecentExecutions(): WorkflowExecutionDto[] {
    return this.recentExecutions;
  }

  // Trigger endpoint: looks the workflow up, builds the request a real n8n call
  // would send, then resolves immediately with a mock result instead of sending
  // it - "Do NOT call n8n yet" per the Sprint 14 brief.
  triggerWorkflow(id: string, dto: TriggerWorkflowDto): WorkflowExecutionDto {
    const workflow = this.workflowRegistry.findById(id);
    const event = this.buildWorkflowEvent(workflow, dto);
    const request = this.buildExecutionRequest(workflow, event);

    const execution: WorkflowExecutionDto = {
      executionId: randomUUID(),
      workflowId: workflow.id,
      status: 'mock_success',
      triggeredAt: event.triggeredAt,
      completedAt: new Date().toISOString(),
      triggeredBy: event.triggeredBy,
      payload: event.payload,
      requestPreview: request,
    };

    this.recentExecutions.unshift(execution);
    this.recentExecutions.length = Math.min(this.recentExecutions.length, MAX_RECENT_EXECUTIONS);

    return execution;
  }

  private buildWorkflowEvent(workflow: WorkflowDefinition, dto: TriggerWorkflowDto): WorkflowEvent {
    return {
      eventId: randomUUID(),
      workflowId: workflow.id,
      triggeredAt: new Date().toISOString(),
      triggeredBy: dto.triggeredBy ?? null,
      payload: dto.payload ?? {},
    };
  }

  // Shapes the HTTP call that would run this workflow in n8n (a webhook POST,
  // the standard way n8n exposes a workflow externally) - never sent this sprint.
  private buildExecutionRequest(
    workflow: WorkflowDefinition,
    event: WorkflowEvent,
  ): WorkflowExecutionRequest {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.n8nConfig.apiKey) {
      headers['X-N8N-Api-Key'] = this.n8nConfig.apiKey;
    }

    return {
      method: 'POST',
      url: `${this.n8nConfig.baseUrl}/webhook/${workflow.id}`,
      headers,
      body: { eventId: event.eventId, triggeredBy: event.triggeredBy, payload: event.payload },
    };
  }
}
