import { IntegrationStatus } from './integration-status.model';

/** WhatsApp Cloud API configuration - placeholder only, no Meta API calls are made. */
export interface WhatsAppIntegration {
  businessNumber: string;
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  verifyToken: string;
  webhookUrl: string;
  status: IntegrationStatus;
  updatedAt: string;
}

export type WhatsAppIntegrationInput = Omit<WhatsAppIntegration, 'status' | 'updatedAt'>;
