import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { KnowledgeBaseService } from '../../services/knowledge-base.service';
import { Faq, FaqInput } from '../../models/faq.model';
import { KnowledgeBaseNav } from '../../components/knowledge-base-nav/knowledge-base-nav';
import { FaqTable } from '../../components/faq-table/faq-table';
import { FaqForm, FaqFormDialogData } from '../../components/faq-form/faq-form';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-faqs',
  imports: [MatButtonModule, MatIconModule, KnowledgeBaseNav, FaqTable],
  templateUrl: './faqs.html',
  styleUrl: './faqs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Faqs {
  private readonly knowledgeBaseService = inject(KnowledgeBaseService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly faqs = this.knowledgeBaseService.faqs;

  addFaq(): void {
    this.openForm(null);
  }

  editFaq(faq: Faq): void {
    this.openForm(faq);
  }

  deleteFaq(faq: Faq): void {
    const dialogRef = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Delete FAQ',
        message: `Are you sure you want to delete "${faq.question}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.knowledgeBaseService.deleteFaq(faq.id).subscribe(() => {
        this.snackBar.open('FAQ deleted.', 'Dismiss', { duration: 3000 });
      });
    });
  }

  private openForm(faq: Faq | null): void {
    const dialogRef = this.dialog.open<FaqForm, FaqFormDialogData, FaqInput>(FaqForm, {
      data: { faq },
    });

    dialogRef.afterClosed().subscribe((input) => {
      if (!input) {
        return;
      }

      const request = faq
        ? this.knowledgeBaseService.updateFaq(faq.id, input)
        : this.knowledgeBaseService.createFaq(input);

      request.subscribe(() => {
        this.snackBar.open(faq ? 'FAQ updated.' : 'FAQ added.', 'Dismiss', { duration: 3000 });
      });
    });
  }
}
