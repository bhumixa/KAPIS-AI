/** Mirrors the folders under services/n8n-workflows/ - one category per business area. */
export type WorkflowCategory = 'appointments' | 'patients' | 'conversations' | 'automation';

export type WorkflowTriggerType = 'webhook' | 'manual' | 'event';

/**
 * A workflow this platform knows about. Sprint 14 registers these statically
 * (see registry/workflow-definitions.seed.ts) - none of them point at a real,
 * active n8n workflow yet (`n8nWorkflowId` is always null, `active` is always
 * false). Later sprints replace the static seed with a real n8n workflow list
 * without changing this shape.
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  triggerType: WorkflowTriggerType;
  /** Path to the placeholder export under services/n8n-workflows/, for traceability. */
  workflowFile: string;
  /** The workflow's id inside n8n itself - null until it's actually imported/activated there. */
  n8nWorkflowId: string | null;
  active: boolean;
}
