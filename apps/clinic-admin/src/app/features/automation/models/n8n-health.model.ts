/** Mirrors apps/api-server's N8nHealthDto. */
export interface N8nHealth {
  status: 'ok';
  timestamp: string;
  configured: boolean;
  reachable: boolean;
  apiConfigured: boolean;
  baseUrl: string;
  registeredWorkflowCount: number;
  lastSuccessfulConnection: string | null;
}
