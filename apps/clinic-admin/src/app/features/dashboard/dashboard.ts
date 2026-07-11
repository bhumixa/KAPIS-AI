import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DoctorService } from '../doctors/services/doctor.service';
import { AvailabilityService } from '../doctors/services/availability.service';
import { PatientService } from '../patients/services/patient.service';
import { AppointmentService } from '../appointments/services/appointment.service';
import { ClinicService } from '../settings/services/clinic.service';
import { KnowledgeBaseService } from '../knowledge-base/services/knowledge-base.service';
import { IntegrationService } from '../integrations/services/integration.service';
import { GoogleCalendarService } from '../integrations/services/google-calendar.service';
import { IntegrationStatusChip } from '../integrations/components/integration-status-chip/integration-status-chip';
import { ConversationService } from '../conversations/services/conversation.service';
import { MessageService } from '../conversations/services/message.service';
import { ROUTE_PATHS } from '../../core/constants/route-paths.constant';
import { QuickAction, SummaryCard } from './dashboard-summary.model';

/**
 * Sprint 1 had no backend, so every number here was a hardcoded placeholder.
 * Doctors, Doctors Available Today, Doctors On Leave (Sprint 2/3), Patients
 * (Sprint 4), Today's/Upcoming/Cancelled/Completed Appointments (Sprint 5),
 * the clinic identity banner (Sprint 6), Services/FAQs/Templates (Sprint 7),
 * the integration health row (Sprint 8), and Active Conversations/AI
 * Pending/Unread Messages (Sprint 9) are all live off their respective
 * services; nothing on this page is hardcoded anymore.
 */
@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, IntegrationStatusChip],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly snackBar = inject(MatSnackBar);
  private readonly doctorService = inject(DoctorService);
  private readonly availabilityService = inject(AvailabilityService);
  private readonly patientService = inject(PatientService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly clinicService = inject(ClinicService);
  private readonly knowledgeBaseService = inject(KnowledgeBaseService);
  private readonly integrationService = inject(IntegrationService);
  private readonly googleCalendarService = inject(GoogleCalendarService);
  private readonly conversationService = inject(ConversationService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  readonly clinicProfile = this.clinicService.clinicProfile;
  readonly isClinicOpenNow = this.clinicService.isOpenNow;
  readonly whatsappIntegration = this.integrationService.whatsapp;
  readonly claudeIntegration = this.integrationService.claude;
  readonly googleCalendarIntegration = this.googleCalendarService.connection;
  readonly activeWebhookCount = this.integrationService.activeWebhookCount;
  readonly webhookCount = this.integrationService.webhookCount;

  readonly summaryCards = computed<SummaryCard[]>(() => [
    {
      label: "Today's Appointments",
      value: this.appointmentService.todaysAppointmentCount(),
      icon: 'event',
      accentVar: '--mat-sys-primary',
    },
    {
      label: 'Doctors',
      value: this.doctorService.doctorCount(),
      icon: 'medical_services',
      accentVar: '--mat-sys-tertiary',
    },
    {
      label: 'Patients',
      value: this.patientService.patientCount(),
      icon: 'groups',
      accentVar: '--kapis-color-success',
    },
    {
      label: 'Active Conversations',
      value: this.conversationService.activeConversationCount(),
      icon: 'forum',
      accentVar: '--kapis-color-warning',
    },
    {
      label: 'AI Pending',
      value: this.conversationService.aiPendingCount(),
      icon: 'smart_toy',
      accentVar: '--mat-sys-tertiary',
    },
    {
      label: 'Unread Messages',
      value: this.messageService.totalUnreadCount(),
      icon: 'mark_chat_unread',
      accentVar: '--kapis-color-error',
    },
    {
      label: 'Doctors Available Today',
      value: this.availabilityService.doctorsAvailableToday(),
      icon: 'event_available',
      accentVar: '--kapis-color-success',
    },
    {
      label: 'Doctors On Leave',
      value: this.availabilityService.doctorsOnLeaveToday(),
      icon: 'event_busy',
      accentVar: '--kapis-color-warning',
    },
    {
      label: 'Upcoming Appointments',
      value: this.appointmentService.upcomingAppointmentCount(),
      icon: 'upcoming',
      accentVar: '--mat-sys-primary',
    },
    {
      label: 'Cancelled Today',
      value: this.appointmentService.cancelledTodayCount(),
      icon: 'event_busy',
      accentVar: '--kapis-color-warning',
    },
    {
      label: 'Completed Today',
      value: this.appointmentService.completedTodayCount(),
      icon: 'task_alt',
      accentVar: '--kapis-color-success',
    },
    {
      label: 'Services',
      value: this.knowledgeBaseService.serviceCount(),
      icon: 'medical_information',
      accentVar: '--mat-sys-primary',
    },
    {
      label: 'FAQs',
      value: this.knowledgeBaseService.faqCount(),
      icon: 'quiz',
      accentVar: '--mat-sys-tertiary',
    },
    {
      label: 'Templates',
      value: this.knowledgeBaseService.templateCount(),
      icon: 'forum',
      accentVar: '--kapis-color-success',
    },
  ]);

  readonly quickActions: QuickAction[] = [
    { label: 'New Appointment', icon: 'add_circle' },
    { label: 'Add Patient', icon: 'person_add' },
    { label: 'Add Doctor', icon: 'medical_information' },
    { label: 'Send Message', icon: 'send' },
  ];

  onQuickAction(action: QuickAction): void {
    if (action.label === 'Add Doctor') {
      this.router.navigate([ROUTE_PATHS.DOCTORS, 'add']);
      return;
    }

    if (action.label === 'Add Patient') {
      this.router.navigate([ROUTE_PATHS.PATIENTS, 'add']);
      return;
    }

    if (action.label === 'New Appointment') {
      this.router.navigate([ROUTE_PATHS.APPOINTMENTS, 'book']);
      return;
    }

    if (action.label === 'Send Message') {
      this.router.navigate([ROUTE_PATHS.CONVERSATIONS]);
      return;
    }

    this.snackBar.open(`${action.label} is coming soon.`, 'Dismiss', { duration: 3000 });
  }
}
