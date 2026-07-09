/** Placeholder only - Sprint 6 stores these fields but makes no Meta WhatsApp Cloud API calls. */
export interface WhatsAppSettings {
  enabled: boolean;
  businessPhoneNumber: string;
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  webhookUrl: string;
  updatedAt: string;
}

export type WhatsAppSettingsInput = Omit<WhatsAppSettings, 'updatedAt'>;
