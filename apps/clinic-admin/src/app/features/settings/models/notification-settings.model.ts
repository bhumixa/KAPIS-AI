export interface NotificationSettings {
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  appointmentReminder: boolean;
  /** Hours before the appointment start that the reminder fires. */
  reminderTimeHours: number;
  welcomeMessage: string;
  cancellationMessage: string;
  followUpReminder: boolean;
  updatedAt: string;
}

export type NotificationSettingsInput = Omit<NotificationSettings, 'updatedAt'>;
