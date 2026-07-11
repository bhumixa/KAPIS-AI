/** One clinic.workflow_runtime_logs row per step - the pipeline stages the Sprint 21 brief's flow diagram names. */
export enum WorkflowStep {
  RECEIVED = 'RECEIVED',
  CONTEXT_BUILT = 'CONTEXT_BUILT',
  AI_EXECUTED = 'AI_EXECUTED',
  N8N_TRIGGERED = 'N8N_TRIGGERED',
  DECISION_MADE = 'DECISION_MADE',
  REPLY_SENT = 'REPLY_SENT',
  HISTORY_PERSISTED = 'HISTORY_PERSISTED',
  RETRY = 'RETRY',
  FAILED = 'FAILED',
}

/** clinic.workflow_runtime_logs.status - the outcome of a single step, distinct from the run-level WorkflowRunStatus. */
export enum WorkflowStepStatus {
  STARTED = 'started',
  SUCCESS = 'success',
  FAILED = 'failed',
}
