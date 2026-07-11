export type WorkflowRuntimeDecision = 'AUTO_REPLY' | 'CREATE_TASK' | 'HANDOFF' | 'NO_ACTION';
export type WorkflowRuntimeStatus = 'RUNNING' | 'RETRYING' | 'COMPLETED' | 'FAILED';

/** Mirrors apps/api-server's WorkflowRuntimeExecutionDto - one end-to-end automated pipeline run. */
export interface WorkflowRuntimeExecution {
  id: string;
  conversationId: string | null;
  messageId: string | null;
  whatsappMessageId: string | null;
  aiExecutionId: string | null;
  n8nExecutionId: string | null;
  triggerSource: string;
  decision: WorkflowRuntimeDecision | null;
  status: WorkflowRuntimeStatus;
  retryCount: number;
  aiLatencyMs: number | null;
  workflowLatencyMs: number | null;
  durationMs: number | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
