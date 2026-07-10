export type WorkflowExecutionStatus = 'mock_success';

/** Mirrors apps/api-server's WorkflowExecutionDto - always mocked this sprint, never a real n8n run. */
export interface WorkflowExecution {
  executionId: string;
  workflowId: string;
  status: WorkflowExecutionStatus;
  triggeredAt: string;
  completedAt: string;
  triggeredBy: string | null;
  payload: Record<string, unknown>;
  requestPreview: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: Record<string, unknown>;
  };
}
