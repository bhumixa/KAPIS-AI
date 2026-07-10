export type WorkflowExecutionStatus = 'success' | 'failed';

/** Mirrors apps/api-server's WorkflowExecutionDto - the result of a real call to n8n's webhook. */
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: WorkflowExecutionStatus;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown> | null;
  errorMessage: string | null;
}
