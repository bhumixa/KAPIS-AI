import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { N8nHealthDto } from './dto/n8n-health.dto';
import { TriggerWorkflowDto } from './dto/trigger-workflow.dto';
import { WorkflowDefinitionDto } from './dto/workflow-definition.dto';
import { WorkflowExecutionDto } from './dto/workflow-execution.dto';
import { WorkflowImportService } from './import/workflow-import.service';
import { N8nService } from './n8n.service';

// @Public() on every route, same escape hatch DoctorsController/HealthController
// use - no login flow exists yet for the Angular app to send a real token with.
@Public()
@ApiTags('n8n')
@Controller('n8n')
export class N8nController {
  constructor(
    private readonly n8nService: N8nService,
    private readonly workflowImportService: WorkflowImportService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'n8n bridge health - reachability, API key config, workflow count, last successful connection' })
  checkHealth(): Promise<N8nHealthDto> {
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

  @Post('workflows/import/:id')
  @ApiOperation({ summary: 'Import a workflow definition into n8n and activate it - never runs automatically' })
  importWorkflow(@Param('id') id: string): Promise<WorkflowDefinitionDto> {
    return this.workflowImportService.importWorkflow(id);
  }

  @Post('workflows/:id/trigger')
  @ApiOperation({ summary: 'Trigger a workflow by calling its real n8n webhook; logs and returns the execution result' })
  triggerWorkflow(
    @Param('id') id: string,
    @Body() dto: TriggerWorkflowDto,
  ): Promise<WorkflowExecutionDto> {
    return this.n8nService.triggerWorkflow(id, dto);
  }

  @Get('executions/recent')
  @ApiOperation({ summary: 'Recent workflow executions, most recent first (persisted in Postgres)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listRecentExecutions(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<WorkflowExecutionDto[]> {
    return this.n8nService.getRecentExecutions(limit);
  }
}
