import { WorkflowDefinition } from '../models/workflow-definition.model';

/**
 * Static seed for WorkflowRegistryService. Each entry corresponds to a
 * placeholder export under services/n8n-workflows/<category>/ - no real n8n
 * workflow exists behind any of these yet (`n8nWorkflowId: null`, `active:
 * false`). Adding a real workflow later means updating one row here, not
 * changing the registry's shape.
 */
export const WORKFLOW_DEFINITIONS_SEED: WorkflowDefinition[] = [
  {
    id: 'appointment-reminder',
    name: 'Appointment Reminder',
    description: 'Placeholder for a future appointment reminder workflow. No logic implemented.',
    category: 'appointments',
    triggerType: 'event',
    workflowFile: 'services/n8n-workflows/appointments/appointment-reminder.json',
    n8nWorkflowId: null,
    active: false,
  },
  {
    id: 'patient-intake',
    name: 'Patient Intake',
    description: 'Placeholder for a future patient intake workflow. No logic implemented.',
    category: 'patients',
    triggerType: 'webhook',
    workflowFile: 'services/n8n-workflows/patients/patient-intake.json',
    n8nWorkflowId: null,
    active: false,
  },
  {
    id: 'conversation-routing',
    name: 'Conversation Routing',
    description: 'Placeholder for a future inbound-message routing workflow. No logic implemented.',
    category: 'conversations',
    triggerType: 'webhook',
    workflowFile: 'services/n8n-workflows/conversations/conversation-routing.json',
    n8nWorkflowId: null,
    active: false,
  },
  {
    id: 'daily-digest',
    name: 'Daily Digest',
    description: 'Placeholder for a future clinic daily-summary workflow. No logic implemented.',
    category: 'automation',
    triggerType: 'manual',
    workflowFile: 'services/n8n-workflows/automation/daily-digest.json',
    n8nWorkflowId: null,
    active: false,
  },
];
