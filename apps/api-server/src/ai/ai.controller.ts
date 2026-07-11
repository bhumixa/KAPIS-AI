import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { AiHistoryService } from './ai-history.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { AiConversationContextDto } from './dto/ai-conversation-context.dto';
import { AiDashboardStatsDto } from './dto/ai-dashboard-stats.dto';
import { AiExecutionHistoryDto, AiExecutionResultDto } from './dto/ai-execution.dto';
import { AiProviderHealthDto } from './dto/ai-provider-health.dto';
import { GenerateRequestDto } from './dto/generate-request.dto';
import { PromptDto } from './dto/prompt.dto';
import { PromptTemplateType } from './dto/prompt-template.dto';
import { QueryAiHistoryDto } from './dto/query-ai-history.dto';
import { AI_PROVIDER, AiProvider } from './providers/ai-provider.interface';

// @Public() on every route, same escape hatch every other business controller
// uses until a real login endpoint exists (see docs/DevelopmentGuide.md).
//
// The four routes the Sprint 17 brief names verbatim (context/prompt/generate/
// history), plus GET stats (dashboard aggregates) and, as of Sprint 18,
// GET provider/health (the real Claude provider's configured/reachable state) -
// small additions beyond the brief's literal list, each justified by a
// Dashboard requirement that needs more than the raw history page returns.
// Depends on the AI_PROVIDER token (interface), never ClaudeProviderService
// directly - same isolation AiExecutionService holds one layer down.
@Public()
@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(
    private readonly orchestrator: AiOrchestratorService,
    private readonly historyService: AiHistoryService,
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProvider,
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
      'Run the full AI pipeline (context -> prompt -> AI provider -> history) and return the ' +
      'generated reply. Calls the real Claude provider - see apps/api-server/src/claude/.',
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
    summary:
      "Today's execution count, average latency, token usage, and success rate, plus the " +
      'currently-configured provider/model - for the Automation dashboard',
  })
  async getStats(): Promise<AiDashboardStatsDto> {
    const stats = await this.historyService.getDashboardStats();
    const info = this.aiProvider.getInfo();
    return { ...stats, provider: info.provider, model: info.model };
  }

  @Get('provider/health')
  @ApiOperation({
    summary: "The AI provider's configured/reachable state (real HTTPS reachability check)",
  })
  getProviderHealth(): Promise<AiProviderHealthDto> {
    return this.aiProvider.checkHealth();
  }
}
