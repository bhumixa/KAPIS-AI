import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { QueryWorkflowRuntimeDto } from './dto/query-workflow-runtime.dto';
import { WorkflowRuntimeDashboardStatsDto } from './dto/workflow-runtime-dashboard-stats.dto';
import { WorkflowRuntimeExecutionDto } from './dto/workflow-runtime-execution.dto';
import { WorkflowRuntimeHealthDto } from './dto/workflow-runtime-health.dto';
import { WorkflowRuntimeLogDto } from './dto/workflow-runtime-log.dto';
import { WorkflowRuntimeService } from './services/workflow-runtime.service';

// @Public() on every route - same escape hatch every other domain controller
// in this codebase uses (N8nController, WhatsappController, AiController) -
// no login flow exists yet for the Angular app to send a real token with.
// Read-only: the pipeline itself only ever runs off the whatsapp.incoming-message
// event (see ConversationWorkflowService), there is no POST /trigger here -
// the Sprint 21 brief's flow is meant to be fully automatic, not manually kicked off.
@Public()
@ApiTags('workflow-runtime')
@Controller('workflow-runtime')
export class WorkflowRuntimeController {
  constructor(private readonly workflowRuntimeService: WorkflowRuntimeService) {}

  @Get('health')
  @ApiOperation({ summary: 'Aggregate health of every dependency the automated pipeline chains together: AI, WhatsApp, n8n, Database' })
  getHealth(): Promise<WorkflowRuntimeHealthDto> {
    return this.workflowRuntimeService.getHealth();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard stats: running/completed/failed counts, average runtime/AI latency/workflow latency, success rate' })
  getStats(): Promise<WorkflowRuntimeDashboardStatsDto> {
    return this.workflowRuntimeService.getDashboardStats();
  }

  @Get('executions')
  @ApiOperation({ summary: 'List recent end-to-end pipeline runs, optionally filtered by status or conversation' })
  listExecutions(@Query() query: QueryWorkflowRuntimeDto): Promise<WorkflowRuntimeExecutionDto[]> {
    return this.workflowRuntimeService.findExecutions(query);
  }

  @Get('executions/:id/logs')
  @ApiOperation({ summary: 'Step-by-step trace for a single pipeline run (received, context built, AI executed, n8n triggered, decision made, reply sent, history persisted, retries)' })
  listLogs(@Param('id') id: string): Promise<WorkflowRuntimeLogDto[]> {
    return this.workflowRuntimeService.findLogs(id);
  }
}
