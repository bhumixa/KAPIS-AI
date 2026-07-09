import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { KnowledgeBaseService } from '../../services/knowledge-base.service';
import { InsuranceProvider, InsuranceProviderInput } from '../../models/insurance-provider.model';
import { KnowledgeBaseNav } from '../../components/knowledge-base-nav/knowledge-base-nav';
import { InsuranceProviderTable } from '../../components/insurance-provider-table/insurance-provider-table';
import {
  InsuranceProviderForm,
  InsuranceProviderFormDialogData,
} from '../../components/insurance-provider-form/insurance-provider-form';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-insurance-providers',
  imports: [MatButtonModule, MatIconModule, KnowledgeBaseNav, InsuranceProviderTable],
  templateUrl: './insurance-providers.html',
  styleUrl: './insurance-providers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsuranceProviders {
  private readonly knowledgeBaseService = inject(KnowledgeBaseService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly providers = this.knowledgeBaseService.insuranceProviders;

  addProvider(): void {
    this.openForm(null);
  }

  editProvider(provider: InsuranceProvider): void {
    this.openForm(provider);
  }

  deleteProvider(provider: InsuranceProvider): void {
    const dialogRef = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Delete Insurance Provider',
        message: `Are you sure you want to delete "${provider.name}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.knowledgeBaseService.deleteInsuranceProvider(provider.id).subscribe(() => {
        this.snackBar.open(`${provider.name} deleted.`, 'Dismiss', { duration: 3000 });
      });
    });
  }

  private openForm(provider: InsuranceProvider | null): void {
    const dialogRef = this.dialog.open<
      InsuranceProviderForm,
      InsuranceProviderFormDialogData,
      InsuranceProviderInput
    >(InsuranceProviderForm, { data: { provider } });

    dialogRef.afterClosed().subscribe((input) => {
      if (!input) {
        return;
      }

      const request = provider
        ? this.knowledgeBaseService.updateInsuranceProvider(provider.id, input)
        : this.knowledgeBaseService.createInsuranceProvider(input);

      request.subscribe(() => {
        this.snackBar.open(provider ? 'Provider updated.' : 'Provider added.', 'Dismiss', {
          duration: 3000,
        });
      });
    });
  }
}
