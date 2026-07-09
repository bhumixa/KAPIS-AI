import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { HealthStatusDto } from './dto/health-status.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness/readiness probe, including database connectivity' })
  async check(@Res() res: Response): Promise<void> {
    const isDatabaseHealthy = await this.prisma.isDatabaseHealthy();

    const body: HealthStatusDto = {
      status: isDatabaseHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      database: isDatabaseHealthy ? 'up' : 'down',
    };

    res.status(isDatabaseHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json(body);
  }
}
