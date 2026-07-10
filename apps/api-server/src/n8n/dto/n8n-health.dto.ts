import { ApiProperty } from '@nestjs/swagger';

/**
 * Reports whether the n8n bridge is *configured*, not whether n8n is actually
 * reachable - Sprint 14 makes no outbound calls to n8n (see docs/Architecture.md).
 * A later sprint that adds a real ping can add a `reachable` field without
 * breaking this shape.
 */
export class N8nHealthDto {
  @ApiProperty({ enum: ['ok'] })
  status!: 'ok';

  @ApiProperty()
  timestamp!: string;

  @ApiProperty()
  configured!: boolean;

  @ApiProperty()
  baseUrl!: string;

  @ApiProperty()
  registeredWorkflowCount!: number;
}
