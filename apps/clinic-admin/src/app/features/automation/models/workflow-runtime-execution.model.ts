// Sprint 25 adds the four booking-workflow decisions, driven by the AI's own
// intent classification instead of a keyword heuristic - see
// apps/api-server's WorkflowDecision enum.
export type WorkflowRuntimeDecision =
  | 'AUTO_REPLY'
  | 'BOOK_APPOINTMENT'
  | 'RESCHEDULE_APPOINTMENT'
  | 'CANCEL_APPOINTMENT'
  | 'EMERGENCY'
  | 'CREATE_TASK'
  | 'HANDOFF'
  | 'NO_ACTION';
export type WorkflowRuntimeStatus = 'RUNNING' | 'RETRYING' | 'COMPLETED' | 'FAILED';

// The AI's own classification vocabulary (apps/api-server's AiIntent) -
// narrower than WorkflowRuntimeDecision (no CREATE_TASK/NO_ACTION, which the
// AI never returns as an intent, only WorkflowDispatcherService can decide).
export type AiRuntimeIntent =
  | 'GENERAL_INQUIRY'
  | 'BOOK_APPOINTMENT'
  | 'RESCHEDULE_APPOINTMENT'
  | 'CANCEL_APPOINTMENT'
  | 'EMERGENCY'
  | 'HANDOFF';

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
  // Sprint 25 - audit-only copy of the AI's classification for this run.
  intent: AiRuntimeIntent | null;
  intentConfidence: number | null;
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
