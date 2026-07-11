import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export const WHATSAPP_MEDIA_TYPES = ['image', 'document'] as const;
export type WhatsappMediaType = (typeof WHATSAPP_MEDIA_TYPES)[number];

// Metadata only - `link` is a URL Meta itself fetches when sending, never a
// file this API receives or stores (see 041_create_whatsapp_media.sql's
// header comment). This is the *outgoing* shape only (SendMessageDto's
// `media` field) - Meta's incoming media object is a different shape
// (`id`/`mime_type`/`sha256`, no `link`), parsed by MediaService against its
// own internal interface rather than validated through this class.
export class MediaMessageDto {
  @ApiProperty({ enum: WHATSAPP_MEDIA_TYPES })
  @IsIn(WHATSAPP_MEDIA_TYPES)
  mediaType!: WhatsappMediaType;

  @ApiProperty({ description: 'Publicly reachable URL Meta will fetch the media from.' })
  @IsUrl()
  link!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ description: 'Documents only.' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  filename?: string;
}
