import { ApiProperty } from '@nestjs/swagger';

// Mirrors apps/api-server's AiProviderHealth (ai/providers/ai-provider.interface.ts) -
// the GET /api/ai/provider/health response shape.
export class AiProviderHealthDto {
  @ApiProperty()
  configured!: boolean;

  @ApiProperty()
  reachable!: boolean;

  @ApiProperty()
  model!: string;

  @ApiProperty()
  provider!: string;
}
