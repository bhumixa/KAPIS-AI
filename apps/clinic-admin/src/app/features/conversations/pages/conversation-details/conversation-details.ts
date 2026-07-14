import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConversationService } from '../../services/conversation.service';
import { MessageService } from '../../services/message.service';
import { ConversationAssignmentService } from '../../services/conversation-assignment.service';
import { InquiryService } from '../../services/inquiry.service';
import { PatientService } from '../../../patients/services/patient.service';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { UserService } from '../../../settings/services/user.service';
import { WorkflowRuntimeService } from '../../../automation/services/workflow-runtime.service';
import { WorkflowRuntimeExecution } from '../../../automation/models/workflow-runtime-execution.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CONVERSATION_STATUS_LABELS, CONVERSATION_STATUSES } from '../../models/conversation.model';
import { APPOINTMENT_TYPE_LABELS } from '../../../appointments/models/appointment.model';
import { ConversationNote } from '../../models/conversation-note.model';
import { MessageTimeline } from '../../components/message-timeline/message-timeline';
import { AiDraftPanel } from '../../components/ai-draft-panel/ai-draft-panel';
import { AiInsightCard } from '../../components/ai-insight-card/ai-insight-card';
import { InternalNotes, NoteUpdatePayload } from '../../components/internal-notes/internal-notes';
import { ConversationTags } from '../../components/conversation-tags/conversation-tags';
import {
  AssignmentSelection,
  ConversationAssignment,
} from '../../components/conversation-assignment/conversation-assignment';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

/**
 * Unlike Patient/Appointment Details (`toSignal(getX(id))`, a one-shot
 * snapshot), every read here is a `computed()` sourced directly from the
 * owning service's live signal. Sending a reply, changing status, assigning,
 * tagging, and noting all need to show up immediately without navigating
 * away and back - a one-shot Observable capture wouldn't refresh for any of
 * those.
 */
@Component({
  selector: 'app-conversation-details',
  imports: [
    RouterLink,
    DatePipe,
    TitleCasePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MessageTimeline,
    AiDraftPanel,
    InternalNotes,
    ConversationTags,
    ConversationAssignment,
    AiInsightCard,
  ],
  templateUrl: './conversation-details.html',
  styleUrl: './conversation-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationDetails {
  private readonly conversationService = inject(ConversationService);
  private readonly messageService = inject(MessageService);
  private readonly assignmentService = inject(ConversationAssignmentService);
  private readonly inquiryService = inject(InquiryService);
  private readonly patientService = inject(PatientService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly doctorService = inject(DoctorService);
  private readonly userService = inject(UserService);
  private readonly workflowRuntimeService = inject(WorkflowRuntimeService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly conversationId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly conversationsPath = ROUTE_PATHS.CONVERSATIONS;
  readonly statuses = CONVERSATION_STATUSES;
  readonly statusLabels = CONVERSATION_STATUS_LABELS;
  readonly appointmentTypeLabels = APPOINTMENT_TYPE_LABELS;

  readonly conversation = computed(() =>
    this.conversationService.conversations().find((c) => c.id === this.conversationId),
  );

  readonly patient = computed(() => {
    const conversation = this.conversation();
    return conversation?.patientId
      ? this.patientService.patients().find((p) => p.id === conversation.patientId)
      : undefined;
  });

  // Sprint 25 - the Inquiry side of patient(): populated when this
  // conversation belongs to a first-time WhatsApp sender with no patient yet.
  readonly inquiry = computed(() => {
    const conversation = this.conversation();
    return conversation?.inquiryId
      ? this.inquiryService.inquiries().find((i) => i.id === conversation.inquiryId)
      : undefined;
  });

  readonly contactName = computed(() => {
    const conversation = this.conversation();
    return conversation ? this.conversationService.getContactName(conversation) : 'Conversation';
  });

  readonly messages = computed(() =>
    this.messageService.getMessagesForConversation(this.conversationId),
  );

  readonly notes = computed(() =>
    this.conversationService.getNotesForConversation(this.conversationId),
  );

  readonly assignmentHistory = computed(() =>
    this.assignmentService.getAssignmentHistory(this.conversationId),
  );

  readonly assignedToName = computed(() =>
    this.assignmentService.getAssignedUserName(this.conversation()?.assignedToUserId ?? null),
  );

  readonly assignedToRole = computed(() => {
    const userId = this.conversation()?.assignedToUserId;
    if (!userId) {
      return null;
    }
    return this.userService.users().find((u) => u.id === userId)?.role ?? null;
  });

  readonly assignableUsers = computed(() =>
    this.userService
      .users()
      .filter(
        (user) =>
          (user.role === 'receptionist' || user.role === 'doctor') && user.status === 'active',
      ),
  );

  readonly appointmentSummary = computed(() => {
    const patient = this.patient();
    if (!patient) {
      return undefined;
    }

    const today = new Date().toISOString().slice(0, 10);
    const appointments = this.appointmentService
      .appointments()
      .filter((appointment) => appointment.patientId === patient.id);

    const upcoming = appointments
      .filter((appointment) => appointment.status === 'scheduled' && appointment.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))[0];

    return upcoming ?? [...appointments].sort((a, b) => b.date.localeCompare(a.date))[0];
  });

  readonly appointmentDoctor = computed(() => {
    const appointment = this.appointmentSummary();
    return appointment
      ? this.doctorService.doctors().find((doctor) => doctor.id === appointment.doctorId)
      : undefined;
  });

  // Sprint 25 - the AI Insights card's "Workflow Status" source. Not a
  // computed() off a live service signal like everything else here
  // (WorkflowRuntimeService's own `recentExecutions` signal is the
  // Automation Dashboard's global feed, not conversation-scoped) - fetched
  // once per page load, same shape `messageService.markConversationRead()`
  // below already uses for a one-off side effect in the constructor.
  private readonly _workflowExecutions = signal<WorkflowRuntimeExecution[]>([]);
  readonly latestWorkflowExecution = computed(() => this._workflowExecutions().at(0) ?? null);

  constructor() {
    this.messageService.markConversationRead(this.conversationId).subscribe();
    this.workflowRuntimeService
      .getExecutionsForConversation(this.conversationId)
      .subscribe((executions) => this._workflowExecutions.set(executions));
  }

  backToInbox(): void {
    this.router.navigate([this.conversationsPath]);
  }

  onStatusChange(event: MatSelectChange): void {
    this.conversationService.updateStatus(this.conversationId, event.value).subscribe(() => {
      this.snackBar.open('Conversation status updated.', 'Dismiss', { duration: 3000 });
    });
  }

  sendReply(body: string): void {
    this.messageService
      .sendMessage({
        conversationId: this.conversationId,
        direction: 'outgoing',
        sender: 'staff',
        senderName: this.authService.currentUser()?.name ?? 'Staff',
        body,
      })
      .subscribe();
  }

  onDraftAccept(content: string): void {
    this.messageService
      .sendMessage({
        conversationId: this.conversationId,
        direction: 'outgoing',
        sender: 'ai',
        senderName: 'Kapis AI',
        body: content,
      })
      .subscribe(() => {
        this.snackBar.open('AI draft sent as reply.', 'Dismiss', { duration: 3000 });
      });
  }

  addTag(tag: string): void {
    this.conversationService.addTag(this.conversationId, tag).subscribe();
  }

  removeTag(tag: string): void {
    this.conversationService.removeTag(this.conversationId, tag).subscribe();
  }

  addNote(body: string): void {
    this.conversationService
      .addNote({
        conversationId: this.conversationId,
        authorName: this.authService.currentUser()?.name ?? 'Staff',
        body,
      })
      .subscribe(() => {
        this.snackBar.open('Note added.', 'Dismiss', { duration: 2000 });
      });
  }

  updateNote(payload: NoteUpdatePayload): void {
    this.conversationService.updateNote(payload.id, payload.body).subscribe(() => {
      this.snackBar.open('Note updated.', 'Dismiss', { duration: 2000 });
    });
  }

  deleteNote(note: ConversationNote): void {
    const dialogRef = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Delete Note',
        message:
          'Are you sure you want to delete this internal note? This action cannot be undone.',
        confirmLabel: 'Delete',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.conversationService.deleteNote(note.id).subscribe(() => {
        this.snackBar.open('Note deleted.', 'Dismiss', { duration: 2000 });
      });
    });
  }

  onAssign(selection: AssignmentSelection): void {
    this.assignmentService
      .assign({
        conversationId: this.conversationId,
        assignedToUserId: selection.userId,
        assignedToRole: selection.role,
        assignedByName: this.authService.currentUser()?.name ?? 'Staff',
      })
      .subscribe(() => {
        this.snackBar.open('Conversation assigned.', 'Dismiss', { duration: 3000 });
      });
  }

  onUnassign(): void {
    this.assignmentService.unassign(this.conversationId).subscribe(() => {
      this.snackBar.open('Conversation unassigned.', 'Dismiss', { duration: 3000 });
    });
  }
}
