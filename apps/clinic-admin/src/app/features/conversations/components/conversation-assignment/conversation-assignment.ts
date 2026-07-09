import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ClinicUser } from '../../../settings/models/clinic-user.model';

export interface AssignmentSelection {
  userId: string;
  role: ClinicUser['role'];
}

/** Presentational assignment control - the Conversation Details page owns the actual calls to `ConversationAssignmentService`. */
@Component({
  selector: 'app-conversation-assignment',
  imports: [
    TitleCasePipe,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './conversation-assignment.html',
  styleUrl: './conversation-assignment.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationAssignment {
  readonly assignedToUserId = input.required<string | null>();
  readonly assignedToName = input<string | null>(null);
  readonly assignedToRole = input<ClinicUser['role'] | null>(null);
  readonly assignableUsers = input.required<ClinicUser[]>();

  readonly assign = output<AssignmentSelection>();
  readonly unassign = output<void>();

  onSelect(event: MatSelectChange): void {
    const userId = event.value as string;
    const user = this.assignableUsers().find((u) => u.id === userId);
    if (user) {
      this.assign.emit({ userId: user.id, role: user.role });
    }
  }
}
