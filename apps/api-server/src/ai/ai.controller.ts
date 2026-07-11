import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { AiDashboardStats, AiHistoryService } from './ai-history.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { AiConversationContextDto } from './dto/ai-conversation-context.dto';
import { AiExecutionHistoryDto, AiExecutionResultDto } from './dto/ai-execution.dto';
import { GenerateRequestDto } from './dto/generate-request.dto';
import { PromptDto } from './dto/prompt.dto';
import { PromptTemplateType } from './dto/prompt-template.dto';
import { QueryAiHistoryDto } from './dto/query-ai-history.dto';

// @Public() on every route, same escape hatch every other business controller
// uses until a real login endpoint exists (see docs/DevelopmentGuide.md).
//
// The four routes the Sprint 17 brief names verbatim (context/prompt/generate/
// history), plus GET :id/stats for the dashboard's "AI Executions Today"/
// "Average Latency" cards - a small addition beyond the brief's literal list,
// justified by the brief's own "Dashboard" requirement, which needs an
// aggregated count/average rather than the raw history page /ai/history returns.
@Public()
@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(
    private readonly orchestrator: AiOrchestratorService,
    private readonly historyService: AiHistoryService,
  ) {}

  @Get('context/:conversationId')
  @ApiOperation({
    summary:
      'Assemble the complete AI ConversationContext (Conversation Engine context plus ' +
      'recent messages, internal notes, insurance providers, AI persona settings) - read-only',
  })
  getContext(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ): Promise<AiConversationContextDto> {
    return this.orchestrator.getContext(conversationId);
  }

  @Get('prompt/:conversationId')
  @ApiOperation({
    summary: 'Preview the system/user prompt PromptBuilderService would send - no AI call',
  })
  getPromptPreview(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query('templateType') templateType?: PromptTemplateType,
    @Query('userQuestion') userQuestion?: string,
  ): Promise<PromptDto> {
    return this.orchestrator.getPromptPreview(conversationId, templateType, userQuestion);
  }

  @Post('generate')
  @ApiOperation({
    summary:
      'Run the full AI pipeline (context -> prompt -> mock execution -> history) and return ' +
      'the mock response. Never calls Claude/OpenAI/Gemini.',
  })
  generate(@Body() input: GenerateRequestDto): Promise<AiExecutionResultDto> {
    return this.orchestrator.generate(input);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Recent AI execution history, most recent first (persisted in Postgres)',
  })
  getHistory(@Query() query: QueryAiHistoryDto): Promise<AiExecutionHistoryDto[]> {
    return this.historyService.findRecent(query);
  }

  @Get('stats')
  @ApiOperation({
    summary: "Today's execution count and average latency, for the Automation dashboard",
  })
  getStats(): Promise<AiDashboardStats> {
    return this.historyService.getDashboardStats();
  }
}
