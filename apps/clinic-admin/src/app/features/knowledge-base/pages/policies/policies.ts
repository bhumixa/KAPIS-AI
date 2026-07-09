import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { KnowledgeBaseService } from '../../services/knowledge-base.service';
import { Policy, PolicyInput } from '../../models/policy.model';
import { KnowledgeBaseNav } from '../../components/knowledge-base-nav/knowledge-base-nav';
import { PolicyTable } from '../../components/policy-table/policy-table';
import { PolicyForm, PolicyFormDialogData } from '../../components/policy-form/policy-form';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-policies',
  imports: [MatButtonModule, MatIconModule, KnowledgeBaseNav, PolicyTable],
  templateUrl: './policies.html',
  styleUrl: './policies.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Policies {
  private readonly knowledgeBaseService = inject(KnowledgeBaseService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly policies = this.knowledgeBaseService.policies;

  addPolicy(): void {
    this.openForm(null);
  }

  editPolicy(policy: Policy): void {
    this.openForm(policy);
  }

  deletePolicy(policy: Policy): void {
    const dialogRef = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Delete Policy',
        message: `Are you sure you want to delete "${policy.title}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.knowledgeBaseService.deletePolicy(policy.id).subscribe(() => {
        this.snackBar.open(`${policy.title} deleted.`, 'Dismiss', { duration: 3000 });
      });
    });
  }

  private openForm(policy: Policy | null): void {
    const dialogRef = this.dialog.open<PolicyForm, PolicyFormDialogData, PolicyInput>(PolicyForm, {
      data: { policy },
    });

    dialogRef.afterClosed().subscribe((input) => {
      if (!input) {
        return;
      }

      const request = policy
        ? this.knowledgeBaseService.updatePolicy(policy.id, input)
        : this.knowledgeBaseService.createPolicy(input);

      request.subscribe(() => {
        this.snackBar.open(policy ? 'Policy updated.' : 'Policy added.', 'Dismiss', {
          duration: 3000,
        });
      });
    });
  }
}
