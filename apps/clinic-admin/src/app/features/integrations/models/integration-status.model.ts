/** Connection health, set only by a (mock) Test Connection call - never hand-edited in a form. */
export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

export const INTEGRATION_STATUS_LABELS: Record<IntegrationStatus, string> = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  error: 'Error',
};

export interface IntegrationTestResult {
  success: boolean;
  message: string;
  testedAt: string;
}
