import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IntegrationService } from '../../services/integration.service';
import { Webhook, WebhookInput } from '../../models/webhook.model';
import { IntegrationsNav } from '../../components/integrations-nav/integrations-nav';
import { WebhookTable } from '../../components/webhook-table/webhook-table';
import { WebhookForm, WebhookFormDialogData } from '../../components/webhook-form/webhook-form';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-webhooks',
  imports: [MatButtonModule, MatIconModule, IntegrationsNav, WebhookTable],
  templateUrl: './webhooks.html',
  styleUrl: './webhooks.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Webhooks {
  private readonly integrationService = inject(IntegrationService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly webhooks = this.integrationService.webhooks;

  addWebhook(): void {
    this.openForm(null);
  }

  editWebhook(webhook: Webhook): void {
    this.openForm(webhook);
  }

  deleteWebhook(webhook: Webhook): void {
    const dialogRef = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Delete Webhook',
        message: `Are you sure you want to delete "${webhook.name}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.integrationService.deleteWebhook(webhook.id).subscribe(() => {
        this.snackBar.open(`${webhook.name} deleted.`, 'Dismiss', { duration: 3000 });
      });
    });
  }

  private openForm(webhook: Webhook | null): void {
    const dialogRef = this.dialog.open<WebhookForm, WebhookFormDialogData, WebhookInput>(
      WebhookForm,
      { data: { webhook } },
    );

    dialogRef.afterClosed().subscribe((input) => {
      if (!input) {
        return;
      }

      const request = webhook
        ? this.integrationService.updateWebhook(webhook.id, input)
        : this.integrationService.createWebhook(input);

      request.subscribe(() => {
        this.snackBar.open(webhook ? 'Webhook updated.' : 'Webhook added.', 'Dismiss', {
          duration: 3000,
        });
      });
    });
  }
}
