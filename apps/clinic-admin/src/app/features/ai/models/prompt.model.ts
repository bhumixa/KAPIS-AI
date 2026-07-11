import { PromptTemplateType } from './prompt-template.model';

/** Mirrors apps/api-server's PromptMetadataDto. */
export interface PromptMetadata {
  conversationId: string;
  templateType: PromptTemplateType;
  templateId: string | null;
  templateName: string;
  promptTokenEstimate: number;
  generatedAt: string;
}

/** Mirrors apps/api-server's PromptDto - PromptBuilderService's output, no AI call involved. */
export interface Prompt {
  systemPrompt: string;
  userPrompt: string;
  metadata: PromptMetadata;
}
