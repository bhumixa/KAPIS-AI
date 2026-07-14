import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import {
  CONVERSATION_INTENT_LABELS,
  ConversationCollectedFields,
  ConversationIntent,
  ConversationPendingAction,
  PENDING_ACTION_LABELS,
} from '../../models/conversation.model';
import { WorkflowRuntimeExecution } from '../../../automation/models/workflow-runtime-execution.model';

/** One collected-field entry, for the template's @for loop - only non-null fields are ever shown. */
interface CollectedFieldEntry {
  label: string;
  value: string;
}

const FIELD_LABELS: Record<keyof ConversationCollectedFields, string> = {
  doctorName: 'Doctor',
  date: 'Date',
  time: 'Time',
  reason: 'Reason',
  newDate: 'New date',
  newTime: 'New time',
  appointmentReference: 'Appointment',
  cancelConfirmed: 'Cancel confirmed',
};

/**
 * Sprint 25 - the AI receptionist's per-conversation status, presentational
 * only (same `input.required<T>()` + label-record shape as
 * features/integrations/components/integration-status-chip). Dropped into
 * Conversation Details as one additive "AI Insights" card - no existing UI
 * is restructured.
 */
@Component({
  selector: 'app-ai-insight-card',
  imports: [MatChipsModule],
  templateUrl: './ai-insight-card.html',
  styleUrl: './ai-insight-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiInsightCard {
  readonly intent = input<ConversationIntent | null>(null);
  readonly confidence = input<number | null>(null);
  readonly pendingAction = input<ConversationPendingAction | null>(null);
  readonly collectedFields = input<ConversationCollectedFields | null>(null);
  readonly latestExecution = input<WorkflowRuntimeExecution | null>(null);

  readonly intentLabels = CONVERSATION_INTENT_LABELS;
  readonly pendingActionLabels = PENDING_ACTION_LABELS;

  readonly confidencePercent = computed(() => {
    const value = this.confidence();
    return value === null ? null : Math.round(value * 100);
  });

  readonly knownFields = computed<CollectedFieldEntry[]>(() => {
    const fields = this.collectedFields();
    if (!fields) {
      return [];
    }
    return (Object.keys(FIELD_LABELS) as (keyof ConversationCollectedFields)[])
      .filter((key) => fields[key])
      .map((key) => ({ label: FIELD_LABELS[key], value: fields[key] as string }));
  });
}
