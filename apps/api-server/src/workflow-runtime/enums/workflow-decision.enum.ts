/**
 * The outcomes WorkflowDispatcherService can reach after the AI Orchestrator
 * responds, stored verbatim in clinic.workflow_runtime_executions.decision
 * (varchar CHECK, not a Postgres enum - same convention every other
 * status/type column in this schema uses). Sprint 21's original four
 * (AUTO_REPLY/CREATE_TASK/HANDOFF/NO_ACTION) driven by a keyword heuristic;
 * Sprint 25 adds the four booking-workflow outcomes, now driven directly by
 * the AI's own intent classification (see decide() - see
 * database/migrations/047_create_inquiries.sql for the matching CHECK).
 */
export enum WorkflowDecision {
  /** Send the AI-drafted response straight back to the patient via WhatsappService. */
  AUTO_REPLY = 'AUTO_REPLY',
  /** Collect-or-complete a booking: creates the appointment (converting an Inquiry to a Patient first if needed) once all required fields are known. */
  BOOK_APPOINTMENT = 'BOOK_APPOINTMENT',
  /** Reschedules the patient's nearest upcoming appointment once a new date/time are known. */
  RESCHEDULE_APPOINTMENT = 'RESCHEDULE_APPOINTMENT',
  /** Cancels the patient's nearest upcoming appointment - only once the AI has an explicit "yes" (collectedFields.cancelConfirmed). */
  CANCEL_APPOINTMENT = 'CANCEL_APPOINTMENT',
  /** Medical emergency - reply with guidance only, no booking, no n8n trigger. */
  EMERGENCY = 'EMERGENCY',
  /** No task backend exists yet (Sprint 21 doesn't build one) - recorded as the decision, no further action taken. */
  CREATE_TASK = 'CREATE_TASK',
  /** Hand the conversation to a human - moves it to the 'waiting' status via ConversationService. */
  HANDOFF = 'HANDOFF',
  /** Nothing to do - e.g. an empty AI response. */
  NO_ACTION = 'NO_ACTION',
}
