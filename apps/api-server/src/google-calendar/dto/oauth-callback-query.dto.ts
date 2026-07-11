import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

// GET /api/google-calendar/oauth/callback query params - Google's redirect
// back after the user grants/denies consent on its own hosted page (no UI
// login redesign on our side, per the Sprint 22 brief).
export class OAuthCallbackQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Present instead of `code` when the user denies consent.' })
  @IsOptional()
  @IsString()
  error?: string;
}
