import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

// Meta's webhook envelope (POST /api/whatsapp/webhook body). Only the two
// top-level fields are declared/validated - `entry`'s contents are Meta's
// own deeply nested, evolving schema (messages vs. statuses vs. future event
// types, each with type-specific fields), so it's deliberately left as
// `Record<string, unknown>[]` rather than a fully-typed nested class tree.
// This is intentional, not incomplete: the global ValidationPipe's
// `forbidNonWhitelisted` only inspects properties *decorated* on a DTO
// class - an undecorated nested object is never whitelisted/stripped, so a
// Meta payload shape this sprint doesn't fully model still round-trips to
// WebhookService untouched, instead of a 400 the moment Meta adds a field.
// WebhookService/MediaService narrow `entry` with their own type guards
// before reading anything out of it.
export class WebhookEventDto {
  @ApiProperty({ example: 'whatsapp_business_account' })
  @IsString()
  object!: string;

  @ApiProperty({ type: [Object] })
  @IsArray()
  entry!: Record<string, unknown>[];
}
