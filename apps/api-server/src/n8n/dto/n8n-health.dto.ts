import { ApiProperty } from '@nestjs/swagger';

/**
 * Sprint 15: unlike Sprint 14 (config-only), `reachable` is a real check - a
 * timed GET to n8n's own `/healthz` (the same endpoint docker-compose.yml's
 * `n8n` service healthcheck uses). `configured` stays as "base URL resolved to
 * a non-empty string"; `apiConfigured` is the separate question of whether
 * N8N_API_KEY is set, since import (unlike trigger/health) needs it.
 */
export class N8nHealthDto {
  @ApiProperty({ enum: ['ok'] })
  status!: 'ok';

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({ description: 'Whether N8N_BRIDGE_BASE_URL (or its container defaults) resolved to a non-empty URL.' })
  configured!: boolean;

  @ApiProperty({ description: 'Whether a GET to {baseUrl}/healthz succeeded just now.' })
  reachable!: boolean;

  @ApiProperty({ description: 'Whether N8N_API_KEY is set - required for POST /n8n/workflows/import/:id.' })
  apiConfigured!: boolean;

  @ApiProperty()
  baseUrl!: string;

  @ApiProperty()
  registeredWorkflowCount!: number;

  @ApiProperty({ nullable: true, description: 'ISO timestamp of the last successful call to n8n, or null if none yet this process.' })
  lastSuccessfulConnection!: string | null;
}
