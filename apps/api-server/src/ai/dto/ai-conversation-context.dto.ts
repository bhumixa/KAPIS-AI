import { ApiProperty } from '@nestjs/swagger';
import { ConversationNoteDto } from '../../conversations/dto/conversation-note.dto';
import { ConversationContextDto } from '../../conversations/dto/conversation-context.dto';
import { MessageDto } from '../../conversations/dto/message.dto';

// Mirrors database/migrations/017_create_insurance_providers.sql - the subset
// PromptBuilderService cares about (name + how to reach them), not the full
// row (contactPerson/status stay internal-only).
export class InsuranceProviderContextDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  website!: string;
}

// Mirrors database/migrations/019_create_ai_prompt_settings.sql - the AI
// receptionist's persona/behavior configuration, read-only here (Settings has
// no backend module yet - see ConversationContextService's doc comment for
// the same reasoning applied to clinic.clinics/knowledge-base tables).
export class AiPromptSettingsContextDto {
  @ApiProperty()
  clinicPersonality!: string;

  @ApiProperty()
  tone!: string;

  @ApiProperty()
  greeting!: string;

  @ApiProperty()
  fallbackMessage!: string;

  @ApiProperty()
  emergencyInstructions!: string;

  @ApiProperty()
  escalationRules!: string;

  @ApiProperty()
  systemPrompt!: string;

  @ApiProperty()
  enabled!: boolean;
}

// The single "complete context object" the Sprint 17 brief asks
// ConversationContextBuilderService to assemble - everything
// ConversationContextService (Sprint 16) already builds (conversation,
// patient, doctor, appointments, clinic profile, knowledge base), plus the
// four pieces that sprint's object didn't need but prompt-building does:
// recent message history, internal notes, insurance providers, and the AI
// persona/behavior settings. Nothing here is persisted or sent to an AI
// provider; it's recomputed on every call, same as ConversationContextDto.
export class AiConversationContextDto {
  @ApiProperty({ type: ConversationContextDto })
  base!: ConversationContextDto;

  @ApiProperty({ type: [MessageDto] })
  recentMessages!: MessageDto[];

  @ApiProperty({ type: [ConversationNoteDto] })
  internalNotes!: ConversationNoteDto[];

  @ApiProperty({ type: [InsuranceProviderContextDto] })
  insuranceProviders!: InsuranceProviderContextDto[];

  @ApiProperty({ type: AiPromptSettingsContextDto, nullable: true })
  aiPromptSettings!: AiPromptSettingsContextDto | null;
}
