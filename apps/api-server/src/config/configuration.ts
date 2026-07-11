import { resolve } from 'node:path';

export interface AppConfig {
  env: string;
  port: number;
  corsOrigins: string[];
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  n8n: {
    baseUrl: string;
    apiKey: string;
    /** Absolute path to the directory holding workflow category folders (services/n8n-workflows/). */
    workflowsDir: string;
    /** Timeout (ms) applied to every outbound call to n8n (webhook trigger, health check, import). */
    httpTimeoutMs: number;
  };
  anthropic: {
    apiKey: string;
    model: string;
    apiUrl: string;
    maxTokens: number;
    temperature: number;
    /** Timeout (ms) applied to every outbound call to the Claude API (messages, health ping). */
    httpTimeoutMs: number;
  };
  whatsapp: {
    phoneNumberId: string;
    accessToken: string;
    verifyToken: string;
    apiUrl: string;
    /** Timeout (ms) applied to every outbound call to the WhatsApp Cloud API (send, phone number lookup). */
    httpTimeoutMs: number;
  };
  workflowRuntime: {
    /** n8n workflow registry id (services/n8n-workflows/) triggered for every automated conversation pipeline run. */
    n8nWorkflowId: string;
    /** Max attempts (including the first) WorkflowRetryService makes for a transient step failure - never infinite, per the Sprint 21 brief. */
    maxRetryAttempts: number;
    /** Base delay (ms) for WorkflowRetryService's backoff between attempts. */
    retryDelayMs: number;
  };
}

export default (): { app: AppConfig } => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.API_PORT ?? 3000),
    corsOrigins: (process.env.CORS_ORIGIN ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
    database: {
      url: process.env.DATABASE_URL ?? '',
    },
    jwt: {
      secret: process.env.JWT_SECRET ?? '',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
      refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    },
    n8n: {
      // Falls back to the n8n container's own vars (docker-compose.yml) so local
      // dev works with zero extra config - N8N_BRIDGE_BASE_URL only needs setting
      // to point the bridge at a different n8n instance.
      baseUrl:
        process.env.N8N_BRIDGE_BASE_URL ??
        `${process.env.N8N_PROTOCOL ?? 'http'}://${process.env.N8N_HOST ?? 'localhost'}:${process.env.N8N_PORT ?? '5678'}`,
      apiKey: process.env.N8N_API_KEY ?? '',
      // Local dev (`npm run start:dev`, cwd = apps/api-server) resolves two levels
      // up to the repo root's services/n8n-workflows/. Docker overrides this to a
      // mounted path (see docker-compose.yml) since the built image's cwd (/app)
      // has no such relative ancestor.
      workflowsDir:
        process.env.N8N_WORKFLOWS_DIR ?? resolve(process.cwd(), '../../services/n8n-workflows'),
      httpTimeoutMs: Number(process.env.N8N_HTTP_TIMEOUT_MS ?? 8000),
    },
    anthropic: {
      // Empty by default (same "allow unset in dev" shape N8N_API_KEY uses) -
      // ClaudeHealthService reports configured: false and ClaudeProviderService
      // throws a clear configuration error rather than calling Claude with a
      // blank key.
      apiKey: process.env.ANTHROPIC_API_KEY ?? '',
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5',
      apiUrl: process.env.ANTHROPIC_API_URL ?? 'https://api.anthropic.com',
      maxTokens: Number(process.env.ANTHROPIC_MAX_TOKENS ?? 1024),
      temperature: Number(process.env.ANTHROPIC_TEMPERATURE ?? 0.7),
      httpTimeoutMs: Number(process.env.ANTHROPIC_HTTP_TIMEOUT_MS ?? 30000),
    },
    whatsapp: {
      // Empty by default, same "allow unset in dev" shape ANTHROPIC_API_KEY
      // uses - PhoneNumberService reports connected: false and
      // WhatsappHttpService throws a clear configuration error rather than
      // calling Meta with a blank token.
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? '',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? '',
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? '',
      apiUrl: process.env.WHATSAPP_API_URL ?? 'https://graph.facebook.com/v20.0',
      httpTimeoutMs: Number(process.env.WHATSAPP_HTTP_TIMEOUT_MS ?? 15000),
    },
    workflowRuntime: {
      // "conversation-routing" (services/n8n-workflows/conversations/) is the
      // Sprint 14 placeholder registered for exactly this: inbound-message
      // routing. Overridable so a clinic can point automated runs at a
      // different registered workflow id without a code change.
      n8nWorkflowId: process.env.WORKFLOW_RUNTIME_N8N_WORKFLOW_ID ?? 'conversation-routing',
      maxRetryAttempts: Number(process.env.WORKFLOW_RUNTIME_MAX_RETRY_ATTEMPTS ?? 3),
      retryDelayMs: Number(process.env.WORKFLOW_RUNTIME_RETRY_DELAY_MS ?? 1000),
    },
  },
});
