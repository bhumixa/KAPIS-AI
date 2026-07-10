import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { N8nHealthDto } from './dto/n8n-health.dto';
import { TriggerWorkflowDto } from './dto/trigger-workflow.dto';
import { WorkflowDefinitionDto } from './dto/workflow-definition.dto';
import { WorkflowExecutionDto } from './dto/workflow-execution.dto';
import { N8nService } from './n8n.service';

// @Public() on every route, same escape hatch DoctorsController/HealthController
// use - no login flow exists yet for the Angular app to send a real token with.
@Public()
@ApiTags('n8n')
@Controller('n8n')
export class N8nController {
  constructor(private readonly n8nService: N8nService) {}

  @Get('health')
  @ApiOperation({ summary: 'n8n bridge configuration status - does not contact n8n itself' })
  checkHealth(): N8nHealthDto {
    return this.n8nService.checkHealth();
  }

  @Get('workflows')
  @ApiOperation({ summary: 'List all registered workflow definitions' })
  listWorkflows(): WorkflowDefinitionDto[] {
    return this.n8nService.listWorkflows();
  }

  @Get('workflows/:id')
  @ApiOperation({ summary: 'Look up a single workflow definition by id' })
  getWorkflow(@Param('id') id: string): WorkflowDefinitionDto {
    return this.n8nService.getWorkflow(id);
  }

  @Post('workflows/:id/trigger')
  @ApiOperation({ summary: 'Trigger a workflow - returns a mock execution result, no call to n8n' })
  triggerWorkflow(
    @Param('id') id: string,
    @Body() dto: TriggerWorkflowDto,
  ): WorkflowExecutionDto {
    return this.n8nService.triggerWorkflow(id, dto);
  }

  @Get('executions/recent')
  @ApiOperation({ summary: 'Recent mock execution results, most recent first (in-memory, not persisted)' })
  listRecentExecutions(): WorkflowExecutionDto[] {
    return this.n8nService.getRecentExecutions();
  }
}
