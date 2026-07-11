import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AI_PROVIDER } from '../ai/providers/ai-provider.interface';
import { GeminiHealthService } from './gemini-health.service';
import { GeminiHttpService } from './gemini-http.service';
import { GeminiProviderService } from './gemini-provider.service';
import { GeminiResponseMapperService } from './gemini-response-mapper.service';

/**
 * The Gemini provider adapter (Sprint 24) - implements the ai/ module's
 * AiProvider port with real HTTPS calls to Google's Gemini API. Binds
 * GeminiProviderService to the AI_PROVIDER token so AiOrchestratorModule
 * (and anything else that injects `@Inject(AI_PROVIDER)`) depends on the
 * AiProvider interface only, never on this class directly - see
 * ai-provider.interface.ts's doc comment.
 */
@Module({
  imports: [HttpModule],
  providers: [
    GeminiHttpService,
    GeminiResponseMapperService,
    GeminiHealthService,
    GeminiProviderService,
    { provide: AI_PROVIDER, useExisting: GeminiProviderService },
  ],
  exports: [AI_PROVIDER],
})
export class GeminiModule {}
