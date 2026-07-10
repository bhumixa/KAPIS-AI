import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from '../config/configuration';
import { N8nHealthDto } from './dto/n8n-health.dto';
import { TriggerWorkflowDto } from './dto/trigger-workflow.dto';
import { WorkflowExecutionDto } from './dto/workflow-execution.dto';
import { WorkflowExecutionsRepository } from './executions/workflow-executions.repository';
import { WorkflowDefinition } from './models/workflow-definition.model';
import { describeN8nError } from './n8n-error.util';
import { WorkflowRegistryService } from './registry/workflow-registry.service';

const DEFAULT_RECENT_LIMIT = 20;

@Injectable()
export class N8nService {
  private readonly logger = new Logger(N8nService.name);
  private readonly n8nConfig: AppConfig['n8n'];
  private lastSuccessfulConnection: Date | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly workflowRegistry: WorkflowRegistryService,
    private readonly executionsRepository: WorkflowExecutionsRepository,
  ) {
    this.n8nConfig = this.configService.get<AppConfig['n8n']>('app.n8n')!;
  }

  async checkHealth(): Promise<N8nHealthDto> {
    const configured = this.n8nConfig.baseUrl.length > 0;
    const reachable = configured && (await this.pingN8n());

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      configured,
      reachable,
      apiConfigured: this.n8nConfig.apiKey.length > 0,
      baseUrl: this.n8nConfig.baseUrl,
      registeredWorkflowCount: this.workflowRegistry.findAll().length,
      lastSuccessfulConnection: this.lastSuccessfulConnection?.toISOString() ?? null,
    };
  }

  listWorkflows(): WorkflowDefinition[] {
    return this.workflowRegistry.findAll();
  }

  getWorkflow(id: string): WorkflowDefinition {
    return this.workflowRegistry.findById(id);
  }

  async getRecentExecutions(limit: number = DEFAULT_RECENT_LIMIT): Promise<WorkflowExecutionDto[]> {
    const executions = await this.executionsRepository.findRecent(limit);
    return executions.map((execution) => ({
      id: execution.id,
      workflowId: execution.workflowId,
      workflowName: execution.workflowName,
      status: execution.status as WorkflowExecutionDto['status'],
      startedAt: execution.startedAt.toISOString(),
      finishedAt: execution.finishedAt?.toISOString() ?? null,
      durationMs: execution.durationMs,
      requestPayload: (execution.requestPayload as Record<string, unknown>) ?? {},
      responsePayload: (execution.responsePayload as Record<string, unknown> | null) ?? null,
      errorMessage: execution.errorMessage,
    }));
  }

  /**
   * Looks the workflow up, POSTs to its n8n webhook, logs the execution to
   * Postgres, and returns the result. Never throws for a failed n8n call - a
   * network error/timeout/non-2xx is recorded as `status: 'failed'` with
   * `errorMessage` set, same as a workflow n8n itself rejected. It only throws
   * for a workflow id the registry doesn't know about (404, via
   * WorkflowRegistryService.findById), since that's a caller error, not an n8n
   * one.
   */
  async triggerWorkflow(id: string, dto: TriggerWorkflowDto): Promise<WorkflowExecutionDto> {
    const workflow = this.workflowRegistry.findById(id);
    const requestPayload: Record<string, unknown> = {
      triggeredBy: dto.triggeredBy ?? null,
      payload: dto.payload ?? {},
    };
    const url = `${this.n8nConfig.baseUrl}/webhook/${workflow.webhookPath}`;
    const startedAt = new Date();

    let status: WorkflowExecutionDto['status'];
    let responsePayload: Record<string, unknown> | null = null;
    let errorMessage: string | null = null;

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, requestPayload, { timeout: this.n8nConfig.httpTimeoutMs }),
      );
      status = 'success';
      responsePayload = this.asRecord(response.data);
      this.lastSuccessfulConnection = new Date();
    } catch (error) {
      status = 'failed';
      errorMessage = describeN8nError(error);
      this.logger.warn(`Trigger of workflow "${id}" failed: ${errorMessage}`);
    }

    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    const saved = await this.executionsRepository.create({
      workflowId: workflow.id,
      workflowName: workflow.name,
      status,
      startedAt,
      finishedAt,
      durationMs,
      requestPayload: requestPayload as Prisma.InputJsonValue,
      responsePayload: (responsePayload as Prisma.InputJsonValue | null) ?? Prisma.JsonNull,
      errorMessage,
    });

    return {
      id: saved.id,
      workflowId: saved.workflowId,
      workflowName: saved.workflowName,
      status,
      startedAt: saved.startedAt.toISOString(),
      finishedAt: saved.finishedAt?.toISOString() ?? null,
      durationMs: saved.durationMs,
      requestPayload,
      responsePayload,
      errorMessage,
    };
  }

  /** GET {baseUrl}/healthz - the same endpoint docker-compose.yml's n8n healthcheck uses. */
  private async pingN8n(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.n8nConfig.baseUrl}/healthz`, {
          timeout: this.n8nConfig.httpTimeoutMs,
        }),
      );
      this.lastSuccessfulConnection = new Date();
      return true;
    } catch (error) {
      this.logger.debug(`n8n health ping failed: ${(error as AxiosError).message ?? error}`);
      return false;
    }
  }

  private asRecord(data: unknown): Record<string, unknown> | null {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as Record<string, unknown>;
    }
    return data === undefined ? null : { value: data };
  }
}
