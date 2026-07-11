export interface WorkflowRuntimeDependencyHealth {
  configured: boolean;
  reachable: boolean;
}

/** Mirrors apps/api-server's WorkflowRuntimeHealthDto. */
export interface WorkflowRuntimeHealth {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  ai: WorkflowRuntimeDependencyHealth;
  whatsapp: WorkflowRuntimeDependencyHealth;
  n8n: WorkflowRuntimeDependencyHealth;
  database: 'up' | 'down';
}
