import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkflowDefinition } from '../models/workflow-definition.model';
import { WORKFLOW_DEFINITIONS_SEED } from './workflow-definitions.seed';

/**
 * In-memory registry of known workflow definitions - seeded once at startup,
 * not backed by Postgres (no WorkflowDefinition migration exists). "Workflow
 * registration" this sprint means "known to this registry", not "persisted" -
 * a database-backed registry is additive work for whenever workflows need to
 * be registered/edited at runtime rather than shipped as code.
 */
@Injectable()
export class WorkflowRegistryService {
  private readonly workflows = new Map<string, WorkflowDefinition>(
    WORKFLOW_DEFINITIONS_SEED.map((workflow) => [workflow.id, workflow]),
  );

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
}
