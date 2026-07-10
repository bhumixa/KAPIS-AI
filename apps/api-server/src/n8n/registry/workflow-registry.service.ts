import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { AppConfig } from '../../config/configuration';
import {
  WorkflowCategory,
  WorkflowDefinition,
  WorkflowTriggerType,
} from '../models/workflow-definition.model';

const CATEGORIES: WorkflowCategory[] = ['appointments', 'patients', 'conversations', 'automation'];

/** Shape of the `meta` block each services/n8n-workflows/<category>/*.json file carries. */
interface WorkflowMeta {
  id: string;
  name: string;
  category: WorkflowCategory;
  version: string;
  description: string;
  webhookPath: string;
  triggerType?: WorkflowTriggerType;
}

/**
 * Loads workflow definitions from services/n8n-workflows/<category>/*.json at
 * startup (`meta` block: id, name, category, version, description, webhookPath) -
 * the JSON exports are the source of truth, not a static in-code seed (Sprint 14).
 * `templates/` is intentionally skipped: those files exist to be copied, not
 * registered. Import/activation state (`n8nWorkflowId`, `active`) lives only in
 * this process's memory - restarting the server means re-importing into n8n.
 */
@Injectable()
export class WorkflowRegistryService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowRegistryService.name);
  private readonly n8nConfig: AppConfig['n8n'];
  private readonly workflows = new Map<string, WorkflowDefinition>();
  /** Absolute path per workflow id, kept out of the public model - only the import flow needs the raw file. */
  private readonly filePaths = new Map<string, string>();

  constructor(private readonly configService: ConfigService) {
    this.n8nConfig = this.configService.get<AppConfig['n8n']>('app.n8n')!;
  }

  onModuleInit(): void {
    this.reload();
  }

  /** Re-scans services/n8n-workflows/ from disk, discarding any in-memory import state. */
  reload(): void {
    this.workflows.clear();
    this.filePaths.clear();

    const rootDir = this.n8nConfig.workflowsDir;
    if (!existsSync(rootDir)) {
      this.logger.warn(`Workflow directory "${rootDir}" does not exist - registry is empty.`);
      return;
    }

    for (const category of CATEGORIES) {
      const categoryDir = join(rootDir, category);
      if (!existsSync(categoryDir)) {
        continue;
      }

      for (const fileName of readdirSync(categoryDir).filter((f) => f.endsWith('.json'))) {
        const filePath = join(categoryDir, fileName);
        try {
          this.registerFile(filePath, rootDir);
        } catch (error) {
          this.logger.error(
            `Skipping invalid workflow file "${filePath}": ${(error as Error).message}`,
          );
        }
      }
    }

    this.logger.log(`Loaded ${this.workflows.size} workflow definition(s) from ${rootDir}`);
  }

  private registerFile(filePath: string, rootDir: string): void {
    const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as { meta?: Partial<WorkflowMeta> };
    const meta = raw.meta;

    if (!meta?.id || !meta.name || !meta.category || !meta.version || !meta.webhookPath) {
      throw new Error('meta block is missing one of id/name/category/version/webhookPath');
    }

    const definition: WorkflowDefinition = {
      id: meta.id,
      name: meta.name,
      description: meta.description ?? '',
      category: meta.category,
      triggerType: meta.triggerType ?? 'manual',
      version: meta.version,
      webhookPath: meta.webhookPath,
      workflowFile: relative(join(rootDir, '..', '..'), filePath),
      n8nWorkflowId: null,
      active: false,
    };

    this.workflows.set(definition.id, definition);
    this.filePaths.set(definition.id, filePath);
  }

  findAll(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  findById(id: string): WorkflowDefinition {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new NotFoundException(`Workflow "${id}" was not found in the registry.`);
    }
    return workflow;
  }

  /** Absolute path to the workflow's raw export JSON - used by WorkflowImportService to read nodes/connections. */
  getFilePath(id: string): string {
    const filePath = this.filePaths.get(id);
    if (!filePath) {
      throw new NotFoundException(`Workflow "${id}" was not found in the registry.`);
    }
    return filePath;
  }

  /** Called by WorkflowImportService once n8n confirms the workflow was created. */
  markImported(id: string, n8nWorkflowId: string): WorkflowDefinition {
    const workflow = this.findById(id);
    const updated: WorkflowDefinition = { ...workflow, n8nWorkflowId, active: true };
    this.workflows.set(id, updated);
    return updated;
  }
}
