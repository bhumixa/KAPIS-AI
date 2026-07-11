/**
 * The four outcomes WorkflowDispatcherService can reach after the AI Orchestrator
 * responds - the Sprint 21 brief's exhaustive "Decision" list, stored verbatim in
 * clinic.workflow_runtime_executions.decision (varchar CHECK, not a Postgres enum -
 * same convention every other status/type column in this schema uses).
 */
export enum WorkflowDecision {
  /** Send the AI-drafted response straight back to the patient via WhatsappService. */
  AUTO_REPLY = 'AUTO_REPLY',
  /** No task backend exists yet (Sprint 21 doesn't build one) - recorded as the decision, no further action taken. */
  CREATE_TASK = 'CREATE_TASK',
  /** Hand the conversation to a human - moves it to the 'waiting' status via ConversationService. */
  HANDOFF = 'HANDOFF',
  /** Nothing to do - e.g. an empty AI response. */
  NO_ACTION = 'NO_ACTION',
}
