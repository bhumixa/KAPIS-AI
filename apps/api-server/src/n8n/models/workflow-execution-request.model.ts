/**
 * The shape of the HTTP call N8nService *would* send to n8n to actually run a
 * workflow. buildExecutionRequest() (n8n.service.ts) constructs this from
 * config + the workflow definition, but Sprint 14 never sends it - it's
 * returned to the caller as a preview so the bridge's request-building logic
 * can be verified before any real call exists.
 */
export interface WorkflowExecutionRequest {
  method: 'POST';
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}
