/** Mirrors the folders under services/n8n-workflows/ - one category per business area. */
export type WorkflowCategory = 'appointments' | 'patients' | 'conversations' | 'automation';

export type WorkflowTriggerType = 'webhook' | 'manual' | 'event';

/**
 * A workflow this platform knows about. Sprint 15 loads these from the `meta` block
 * of each JSON file under services/n8n-workflows/<category>/ (see
 * registry/workflow-registry.service.ts) instead of Sprint 14's static seed array -
 * the export files themselves are now the source of truth. `n8nWorkflowId`/`active`
 * still start out null/false and only become real once `POST
 * /api/n8n/workflows/import/:id` has actually imported the workflow into n8n.
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  triggerType: WorkflowTriggerType;
  /** Semver-ish version string from the workflow file's own `meta.version`. */
  version: string;
  /** Path segment n8n exposes this workflow's webhook under: `${baseUrl}/webhook/${webhookPath}`. */
  webhookPath: string;
  /** Path to the export JSON under services/n8n-workflows/, for traceability. */
  workflowFile: string;
  /** The workflow's id inside n8n itself - null until it's actually imported there. */
  n8nWorkflowId: string | null;
  /** True once this workflow has been imported into n8n this process's lifetime. */
  active: boolean;
}
