import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AI_PROVIDER } from '../ai/providers/ai-provider.interface';
import { ClaudeHealthService } from './claude-health.service';
import { ClaudeHttpService } from './claude-http.service';
import { ClaudeProviderService } from './claude-provider.service';
import { ClaudeResponseMapper } from './claude-response-mapper.service';

/**
 * The Claude provider adapter (Sprint 18) - implements the ai/ module's
 * AiProvider port with real HTTPS calls to Anthropic's Messages API. Binds
 * ClaudeProviderService to the AI_PROVIDER token so AiOrchestratorModule
 * (and anything else that injects `@Inject(AI_PROVIDER)`) depends on the
 * AiProvider interface only, never on this class directly - see
 * ai-provider.interface.ts's doc comment.
 */
@Module({
  imports: [HttpModule],
  providers: [
    ClaudeHttpService,
    ClaudeResponseMapper,
    ClaudeHealthService,
    ClaudeProviderService,
    { provide: AI_PROVIDER, useExisting: ClaudeProviderService },
  ],
  exports: [AI_PROVIDER],
})
export class ClaudeModule {}
