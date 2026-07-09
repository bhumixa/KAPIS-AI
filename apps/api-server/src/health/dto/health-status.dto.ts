import { ApiProperty } from '@nestjs/swagger';

export class HealthStatusDto {
  @ApiProperty({ enum: ['ok', 'error'] })
  status!: 'ok' | 'error';

  @ApiProperty()
  timestamp!: string;

  @ApiProperty()
  uptimeSeconds!: number;

  @ApiProperty({ enum: ['up', 'down'] })
  database!: 'up' | 'down';
}
