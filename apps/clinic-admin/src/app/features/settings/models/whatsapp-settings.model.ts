/**
 * Placeholder only - Sprint 6 stores these fields but makes no Meta WhatsApp Cloud API calls.
 * Access/verify tokens are never editable here - they're env-only
 * (WHATSAPP_ACCESS_TOKEN/WHATSAPP_VERIFY_TOKEN on the backend).
 */
export interface WhatsAppSettings {
  enabled: boolean;
  businessPhoneNumber: string;
  phoneNumberId: string;
  webhookUrl: string;
  updatedAt: string;
}

export type WhatsAppSettingsInput = Omit<WhatsAppSettings, 'updatedAt'>;
