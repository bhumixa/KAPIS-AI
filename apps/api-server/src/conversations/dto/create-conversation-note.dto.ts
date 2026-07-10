import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateConversationNoteDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  authorName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  body!: string;
}
