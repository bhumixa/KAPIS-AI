import { IntegrationStatus } from './integration-status.model';

/**
 * WhatsApp Cloud API configuration - placeholder only, no Meta API calls are made.
 * Access/verify tokens are never editable here - they're env-only
 * (WHATSAPP_ACCESS_TOKEN/WHATSAPP_VERIFY_TOKEN on the backend).
 */
export interface WhatsAppIntegration {
  businessNumber: string;
  phoneNumberId: string;
  wabaId: string;
  webhookUrl: string;
  status: IntegrationStatus;
  updatedAt: string;
}

export type WhatsAppIntegrationInput = Omit<WhatsAppIntegration, 'status' | 'updatedAt'>;
