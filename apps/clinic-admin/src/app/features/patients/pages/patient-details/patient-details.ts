import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { PatientService } from '../../services/patient.service';
import { calculateAge } from '../../utils/patient-age.util';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';
import { ConversationService } from '../../../conversations/services/conversation.service';

@Component({
  selector: 'app-patient-details',
  imports: [
    RouterLink,
    DatePipe,
    TitleCasePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTabsModule,
  ],
  templateUrl: './patient-details.html',
  styleUrl: './patient-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientDetails {
  private readonly patientService = inject(PatientService);
  private readonly conversationService = inject(ConversationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly patientId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly patient = toSignal(this.patientService.getPatient(this.patientId), {
    initialValue: undefined,
  });
  readonly age = computed(() => {
    const patient = this.patient();
    return patient ? calculateAge(patient.dateOfBirth) : null;
  });
  readonly patientsPath = ROUTE_PATHS.PATIENTS;
  readonly conversationsPath = ROUTE_PATHS.CONVERSATIONS;

  /** Sprint 9 integration point: links this tab to the patient's real WhatsApp conversation, if the Conversation Center has one on record. */
  readonly conversation = computed(() =>
    this.conversationService.conversations().find((c) => c.patientId === this.patientId),
  );

  editPatient(): void {
    this.router.navigate([this.patientsPath, this.patientId, 'edit']);
  }
}
