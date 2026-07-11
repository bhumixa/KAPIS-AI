/** Mirrors apps/api-server's WorkflowRuntimeDashboardStatsDto. */
export interface WorkflowRuntimeStats {
  running: number;
  completed: number;
  failed: number;
  averageRuntimeMs: number;
  averageAiLatencyMs: number;
  averageWorkflowLatencyMs: number;
  successRatePercent: number;
}
