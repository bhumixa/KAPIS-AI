/**
 * The internal event a workflow trigger produces. Sprint 14 only logs/returns
 * this - nothing consumes it as a bus message yet, and no HTTP call to n8n is
 * made from it (see N8nService.triggerWorkflow()).
 */
export interface WorkflowEvent {
  eventId: string;
  workflowId: string;
  triggeredAt: string;
  triggeredBy: string | null;
  payload: Record<string, unknown>;
}
