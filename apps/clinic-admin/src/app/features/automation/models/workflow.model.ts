export type WorkflowCategory = 'appointments' | 'patients' | 'conversations' | 'automation';

export type WorkflowTriggerType = 'webhook' | 'manual' | 'event';

export const WORKFLOW_CATEGORY_LABELS: Record<WorkflowCategory, string> = {
  appointments: 'Appointments',
  patients: 'Patients',
  conversations: 'Conversations',
  automation: 'Automation',
};

/** Mirrors apps/api-server's WorkflowDefinitionDto - a workflow this platform knows about. */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  triggerType: WorkflowTriggerType;
  version: string;
  webhookPath: string;
  workflowFile: string;
  /** Set once POST /n8n/workflows/import/:id has actually imported this into n8n. */
  n8nWorkflowId: string | null;
  active: boolean;
}
