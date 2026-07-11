import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { MediaMessageDto } from './media-message.dto';

export const WHATSAPP_MESSAGE_TYPES = ['text', 'template', 'image', 'document'] as const;
export type WhatsappMessageType = (typeof WHATSAPP_MESSAGE_TYPES)[number];

export const WHATSAPP_SENDERS = ['staff', 'ai'] as const;
export type WhatsappSender = (typeof WHATSAPP_SENDERS)[number];

// POST /api/whatsapp/send - the one outbound entry point for every message
// type the Sprint 20 brief lists. `conversationId` (not a raw phone number)
// is the recipient - WhatsappService resolves the patient's WhatsApp number
// from the conversation itself, the same "look it up, don't ask the caller
// to know it" reasoning apps/clinic-admin's ConversationDetails already
// applies to every other conversation action. Exactly one of
// body/templateName/media is required, enforced by `@ValidateIf` against
// `type` rather than four near-duplicate DTOs - same pattern
// CreateConversationDto's sibling DTOs use `@ValidateIf` for already.
export class SendMessageDto {
  @ApiProperty()
  @IsUUID()
  conversationId!: string;

  @ApiProperty({ enum: WHATSAPP_MESSAGE_TYPES })
  @IsIn(WHATSAPP_MESSAGE_TYPES)
  type!: WhatsappMessageType;

  @ApiPropertyOptional({ description: 'Required when type is "text".' })
  @ValidateIf((dto: SendMessageDto) => dto.type === 'text')
  @IsString()
  @MinLength(1)
  body?: string;

  @ApiPropertyOptional({ description: 'Required when type is "template".' })
  @ValidateIf((dto: SendMessageDto) => dto.type === 'template')
  @IsString()
  @MinLength(1)
  templateName?: string;

  @ApiPropertyOptional({ default: 'en_US' })
  @IsOptional()
  @IsString()
  templateLanguage?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  templateParameters?: string[];

  @ApiPropertyOptional({
    type: MediaMessageDto,
    description: 'Required when type is "image" or "document".',
  })
  @ValidateIf((dto: SendMessageDto) => dto.type === 'image' || dto.type === 'document')
  @ValidateNested()
  @Type(() => MediaMessageDto)
  media?: MediaMessageDto;

  @ApiPropertyOptional({ enum: WHATSAPP_SENDERS, default: 'staff' })
  @IsOptional()
  @IsIn(WHATSAPP_SENDERS)
  sender?: WhatsappSender;

  @ApiPropertyOptional({ default: 'Staff' })
  @IsOptional()
  @IsString()
  senderName?: string;
}
