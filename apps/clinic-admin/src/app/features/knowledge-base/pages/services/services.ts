import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { KnowledgeBaseService } from '../../services/knowledge-base.service';
import { ClinicService, ClinicServiceInput } from '../../models/service.model';
import { KnowledgeBaseNav } from '../../components/knowledge-base-nav/knowledge-base-nav';
import { ServiceTable } from '../../components/service-table/service-table';
import { ServiceForm, ServiceFormDialogData } from '../../components/service-form/service-form';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-services',
  imports: [MatButtonModule, MatIconModule, KnowledgeBaseNav, ServiceTable],
  templateUrl: './services.html',
  styleUrl: './services.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Services {
  private readonly knowledgeBaseService = inject(KnowledgeBaseService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly services = this.knowledgeBaseService.services;

  addService(): void {
    this.openForm(null);
  }

  editService(service: ClinicService): void {
    this.openForm(service);
  }

  deleteService(service: ClinicService): void {
    const dialogRef = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Delete Service',
        message: `Are you sure you want to delete "${service.name}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.knowledgeBaseService.deleteService(service.id).subscribe(() => {
        this.snackBar.open(`${service.name} deleted.`, 'Dismiss', { duration: 3000 });
      });
    });
  }

  private openForm(service: ClinicService | null): void {
    const dialogRef = this.dialog.open<ServiceForm, ServiceFormDialogData, ClinicServiceInput>(
      ServiceForm,
      { data: { service } },
    );

    dialogRef.afterClosed().subscribe((input) => {
      if (!input) {
        return;
      }

      const request = service
        ? this.knowledgeBaseService.updateService(service.id, input)
        : this.knowledgeBaseService.createService(input);

      request.subscribe(() => {
        this.snackBar.open(service ? 'Service updated.' : 'Service added.', 'Dismiss', {
          duration: 3000,
        });
      });
    });
  }
}
