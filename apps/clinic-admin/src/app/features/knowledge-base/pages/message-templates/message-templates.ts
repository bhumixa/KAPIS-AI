import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { KnowledgeBaseService } from '../../services/knowledge-base.service';
import { MessageTemplate, MessageTemplateInput } from '../../models/message-template.model';
import { KnowledgeBaseNav } from '../../components/knowledge-base-nav/knowledge-base-nav';
import { MessageTemplateTable } from '../../components/message-template-table/message-template-table';
import {
  MessageTemplateForm,
  MessageTemplateFormDialogData,
} from '../../components/message-template-form/message-template-form';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-message-templates',
  imports: [MatButtonModule, MatIconModule, KnowledgeBaseNav, MessageTemplateTable],
  templateUrl: './message-templates.html',
  styleUrl: './message-templates.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageTemplates {
  private readonly knowledgeBaseService = inject(KnowledgeBaseService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly templates = this.knowledgeBaseService.messageTemplates;

  addTemplate(): void {
    this.openForm(null);
  }

  editTemplate(template: MessageTemplate): void {
    this.openForm(template);
  }

  deleteTemplate(template: MessageTemplate): void {
    const dialogRef = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Delete Message Template',
        message: `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.knowledgeBaseService.deleteMessageTemplate(template.id).subscribe(() => {
        this.snackBar.open(`${template.name} deleted.`, 'Dismiss', { duration: 3000 });
      });
    });
  }

  private openForm(template: MessageTemplate | null): void {
    const dialogRef = this.dialog.open<
      MessageTemplateForm,
      MessageTemplateFormDialogData,
      MessageTemplateInput
    >(MessageTemplateForm, { data: { template } });

    dialogRef.afterClosed().subscribe((input) => {
      if (!input) {
        return;
      }

      const request = template
        ? this.knowledgeBaseService.updateMessageTemplate(template.id, input)
        : this.knowledgeBaseService.createMessageTemplate(input);

      request.subscribe(() => {
        this.snackBar.open(template ? 'Template updated.' : 'Template added.', 'Dismiss', {
          duration: 3000,
        });
      });
    });
  }
}
