import { Injectable, signal } from '@angular/core';
import { Observable, delay, of, tap } from 'rxjs';
import {
  AppointmentSettings,
  AppointmentSettingsInput,
} from '../models/appointment-settings.model';
import { AISettings, AISettingsInput } from '../models/ai-settings.model';
import { WhatsAppSettings, WhatsAppSettingsInput } from '../models/whatsapp-settings.model';
import {
  NotificationSettings,
  NotificationSettingsInput,
} from '../models/notification-settings.model';

function createMockAppointmentSettings(): AppointmentSettings {
  return {
    defaultConsultationDuration: 20,
    bufferBetweenAppointments: 5,
    advanceBookingLimitDays: 30,
    allowOnlineBooking: true,
    cancellationWindowHours: 4,
    rescheduleWindowHours: 4,
    autoConfirmAppointment: true,
    allowWalkIns: true,
    updatedAt: new Date().toISOString(),
  };
}

function createMockAiSettings(): AISettings {
  return {
    enabled: false,
    provider: 'gemini',
    defaultModel: 'gemini-2.5-flash',
    systemPrompt:
      'You are Kapis, an AI receptionist for this clinic. Be concise, warm, and only book ' +
      'appointments within the clinic’s stated availability.',
    temperature: 0.4,
    maxTokens: 1024,
    updatedAt: new Date().toISOString(),
  };
}

function createMockWhatsAppSettings(): WhatsAppSettings {
  return {
    enabled: false,
    businessPhoneNumber: '',
    phoneNumberId: '',
    webhookUrl: '',
    updatedAt: new Date().toISOString(),
  };
}

function createMockNotificationSettings(): NotificationSettings {
  return {
    emailNotifications: true,
    whatsappNotifications: false,
    appointmentReminder: true,
    reminderTimeHours: 24,
    welcomeMessage: 'Welcome to Kapis Clinic! We’re glad to have you as a patient.',
    cancellationMessage: 'Your appointment has been cancelled. Contact us to rebook anytime.',
    followUpReminder: false,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Owns the four operational configuration groups that don't belong to the
 * clinic's own identity (`ClinicService`) or to user/role management
 * (`UserService`): Appointment Settings, AI Settings, WhatsApp Settings, and
 * Notification Settings. Same signal-plus-Observable get/update shape as
 * `ClinicService` - each is singleton config, not a list, so there's one
 * get/update pair per entity rather than full CRUD. AI/WhatsApp settings are
 * placeholders only: fields are stored, nothing here ever calls an external
 * API - that's the job of the future AI/WhatsApp modules this settings
 * screen exists to configure.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly _appointmentSettings = signal<AppointmentSettings>(
    createMockAppointmentSettings(),
  );
  private readonly _aiSettings = signal<AISettings>(createMockAiSettings());
  private readonly _whatsappSettings = signal<WhatsAppSettings>(createMockWhatsAppSettings());
  private readonly _notificationSettings = signal<NotificationSettings>(
    createMockNotificationSettings(),
  );

  readonly appointmentSettings = this._appointmentSettings.asReadonly();
  readonly aiSettings = this._aiSettings.asReadonly();
  readonly whatsappSettings = this._whatsappSettings.asReadonly();
  readonly notificationSettings = this._notificationSettings.asReadonly();

  getAppointmentSettings(): Observable<AppointmentSettings> {
    return of(this._appointmentSettings()).pipe(delay(300));
  }

  updateAppointmentSettings(input: AppointmentSettingsInput): Observable<AppointmentSettings> {
    const updated: AppointmentSettings = { ...input, updatedAt: new Date().toISOString() };
    return of(updated).pipe(
      delay(300),
      tap((settings) => this._appointmentSettings.set(settings)),
    );
  }

  getAiSettings(): Observable<AISettings> {
    return of(this._aiSettings()).pipe(delay(300));
  }

  updateAiSettings(input: AISettingsInput): Observable<AISettings> {
    const updated: AISettings = { ...input, updatedAt: new Date().toISOString() };
    return of(updated).pipe(
      delay(300),
      tap((settings) => this._aiSettings.set(settings)),
    );
  }

  getWhatsAppSettings(): Observable<WhatsAppSettings> {
    return of(this._whatsappSettings()).pipe(delay(300));
  }

  updateWhatsAppSettings(input: WhatsAppSettingsInput): Observable<WhatsAppSettings> {
    const updated: WhatsAppSettings = { ...input, updatedAt: new Date().toISOString() };
    return of(updated).pipe(
      delay(300),
      tap((settings) => this._whatsappSettings.set(settings)),
    );
  }

  getNotificationSettings(): Observable<NotificationSettings> {
    return of(this._notificationSettings()).pipe(delay(300));
  }

  updateNotificationSettings(input: NotificationSettingsInput): Observable<NotificationSettings> {
    const updated: NotificationSettings = { ...input, updatedAt: new Date().toISOString() };
    return of(updated).pipe(
      delay(300),
      tap((settings) => this._notificationSettings.set(settings)),
    );
  }
}
