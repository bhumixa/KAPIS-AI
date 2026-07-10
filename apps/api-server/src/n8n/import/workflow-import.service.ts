import { HttpService } from '@nestjs/axios';
import { BadGatewayException, BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from '../../config/configuration';
import { describeN8nError } from '../n8n-error.util';
import { WorkflowDefinition } from '../models/workflow-definition.model';
import { WorkflowRegistryService } from '../registry/workflow-registry.service';

/** Only the fields n8n's `POST /api/v1/workflows` accepts - everything else (our `meta` block) is stripped. */
interface N8nImportableWorkflow {
  name: string;
  nodes: unknown[];
  connections: Record<string, unknown>;
  settings: Record<string, unknown>;
}

interface N8nWorkflowResponse {
  id: string;
  active: boolean;
}

/**
 * Imports one workflow's export JSON into the local n8n instance via n8n's REST
 * API, then (if the import succeeded) activates it - a webhook trigger node only
 * starts listening once its workflow is active. Never runs automatically; the
 * only caller is POST /api/n8n/workflows/import/:id (Sprint 15 brief: "Do not
 * auto-import").
 */
@Injectable()
export class WorkflowImportService {
  private readonly logger = new Logger(WorkflowImportService.name);
  private readonly n8nConfig: AppConfig['n8n'];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly workflowRegistry: WorkflowRegistryService,
  ) {
    this.n8nConfig = this.configService.get<AppConfig['n8n']>('app.n8n')!;
  }

  async importWorkflow(id: string): Promise<WorkflowDefinition> {
    if (!this.n8nConfig.apiKey) {
      throw new BadRequestException(
        'N8N_API_KEY is not set - generate an n8n API key (n8n UI > Settings > n8n API) and set it in .env before importing workflows.',
      );
    }

    // Throws NotFoundException via the registry if `id` isn't registered - lets
    // that propagate as-is rather than wrapping it.
    const filePath = this.workflowRegistry.getFilePath(id);
    const payload = this.readImportablePayload(filePath);
    const headers = { 'X-N8N-API-KEY': this.n8nConfig.apiKey };

    try {
      const created = await firstValueFrom(
        this.httpService.post<N8nWorkflowResponse>(`${this.n8nConfig.baseUrl}/api/v1/workflows`, payload, {
          headers,
          timeout: this.n8nConfig.httpTimeoutMs,
        }),
      );

      try {
        await firstValueFrom(
          this.httpService.post(
            `${this.n8nConfig.baseUrl}/api/v1/workflows/${created.data.id}/activate`,
            {},
            { headers, timeout: this.n8nConfig.httpTimeoutMs },
          ),
        );
      } catch (activationError) {
        // The workflow exists in n8n even if activation failed (e.g. it has no
        // valid trigger node) - report it as imported but log why triggering it
        // will still fail until it's activated manually in the n8n UI.
        this.logger.warn(
          `Workflow "${id}" imported as n8n id "${created.data.id}" but activation failed: ${describeN8nError(activationError)}`,
        );
      }

      return this.workflowRegistry.markImported(id, created.data.id);
    } catch (error) {
      throw new BadGatewayException(`Failed to import workflow "${id}" into n8n: ${describeN8nError(error)}`);
    }
  }

  private readImportablePayload(filePath: string): N8nImportableWorkflow {
    const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
    const { name, nodes, connections, settings } = raw;
    return { name, nodes, connections, settings };
  }
}
