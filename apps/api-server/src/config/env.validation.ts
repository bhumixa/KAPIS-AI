import * as Joi from 'joi';

// Fails fast on boot when a required variable is missing or malformed, instead of
// surfacing as a confusing runtime error the first time the value is read.
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  API_PORT: Joi.number().port().default(3000),
  CORS_ORIGIN: Joi.string().required(),

  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Sprint 14 added the bridge config; Sprint 15 makes it call n8n for real.
  // Still optional/allow-empty - configuration.ts falls back to the local n8n
  // container's own vars, and an empty N8N_API_KEY just disables import (the
  // trigger/health flows work without it).
  N8N_BRIDGE_BASE_URL: Joi.string().uri().allow('').optional(),
  N8N_API_KEY: Joi.string().allow('').optional(),
  N8N_WORKFLOWS_DIR: Joi.string().allow('').optional(),
  N8N_HTTP_TIMEOUT_MS: Joi.number().positive().optional(),

  // Sprint 18 - the real Claude provider. Allow-empty/optional like N8N_API_KEY:
  // an unset ANTHROPIC_API_KEY doesn't fail boot, it just means
  // ClaudeHealthService reports configured: false and generation requests fail
  // with a clear configuration error instead of an opaque 401 from Anthropic.
  ANTHROPIC_API_KEY: Joi.string().allow('').optional(),
  ANTHROPIC_MODEL: Joi.string().allow('').optional(),
  ANTHROPIC_API_URL: Joi.string().uri().allow('').optional(),
  ANTHROPIC_MAX_TOKENS: Joi.number().positive().optional(),
  ANTHROPIC_TEMPERATURE: Joi.number().min(0).max(1).optional(),
  ANTHROPIC_HTTP_TIMEOUT_MS: Joi.number().positive().optional(),
});
